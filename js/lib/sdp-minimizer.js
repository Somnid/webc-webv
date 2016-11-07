/*
Copyright (c) 2015, Philipp Hancke. All Rights reserved.
Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of Philipp Hancke nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
const SdpMinimizer = (function(){
	function reduce(desc) {
	  var sdp = desc.sdp;
	  var lines = sdp.split('\r\n');
	  lines = lines.filter(function (line) {
		return line.indexOf('a=candidate:') === 0 ||
		  line.indexOf('a=ice-ufrag:') === 0 ||
		  line.indexOf('a=ice-pwd:') === 0 ||
		  line.indexOf('a=fingerprint:') === 0;
	  });
	  lines = lines.sort().reverse().slice(0, 4); // chop off extra cands
	  var comp = lines.map(function (line) {
		switch(line.split(':')[0]) {
		  case 'a=fingerprint':
			var hex = line.substr(22).split(':').map(h => parseInt(h, 16));
			// b64 is slightly more concise than colon-hex
			return btoa(String.fromCharCode.apply(String, hex));
		  case 'a=ice-pwd':
			return line.substr(10); // already b64
		  case 'a=ice-ufrag':
			return line.substr(12); // already b64
		  case 'a=candidate':
			var parts = line.substr(12).split(' ');
			var ip = parts[4].split('.').reduce(function (prev, cur) { return (prev << 8) + parseInt(cur, 10); });
			// take foundation, priority + ip/port from candidate, encode
			// not sure if foundation is required
			// can I have sprintf("%4c%4c%4c%2c" please? pike rocks
			return [parseInt(parts[0], 10), parseInt(parts[3], 10), ip, parseInt(parts[5])].map(a => a.toString(32)).join(',');
		}
	  });
	  return [desc.type === 'offer' ? 'O' : 'A'].concat(comp).join(',');
	}

	function expand(str) {
	  var comp = str.split(',');
	  var sdp = ['v=0',
		'o=- 5498186869896684180 2 IN IP4 127.0.0.1',
		's=-', 't=0 0', 'a=msid-semantic: WMS',
		'm=application 9 DTLS/SCTP 5000',
		'c=IN IP4 0.0.0.0',
		'a=mid:data',
		'a=sctpmap:5000 webrtc-datachannel 1024'
	  ];
	  if (comp[0] === 'A') {
		sdp.push('a=setup:active');
	  } else {
		sdp.push('a=setup:actpass');
	  }
	  sdp.push('a=ice-ufrag:' + comp[1]);
	  sdp.push('a=ice-pwd:' + comp[2]);
	  sdp.push('a=fingerprint:sha-256 ' + atob(comp[3]).split('').map(function (c) { var d = c.charCodeAt(0); var e = c.charCodeAt(0).toString(16).toUpperCase(); if (d < 16) e = '0' + e; return e; }).join(':'));
	  var candparts = comp.splice(4).map(function (c) { return parseInt(c, 32); });
	  if(candparts.length === 0){
		  console.error("no ICE candidates were present");
	  }
	  var ip = [(candparts[2] >> 24) & 0xff, (candparts[2] >> 16) & 0xff, (candparts[2] >> 8) & 0xff, candparts[2] & 0xff].join('.');
	  var cand = ['a=candidate:' + candparts[0],
		 '1', 'udp',
		 candparts[1],
		 ip,
		 candparts[3],
		 'typ host' // well, not a host cand but...
	  ];
	  sdp.push(cand.join(' '));
	  // depending on O/A role we need to append a=setup:actpass or a=setup:active
	  return {type: comp[0] === 'O' ? 'offer' : 'answer', sdp:sdp.join('\r\n') + '\r\n'};
	}

	return {
		reduce : reduce,
		expand : expand
	};
})();
