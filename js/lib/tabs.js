const Tabs = (function() {

    const defaults = {
        root : null, //required
        onChange : function(){},
        hash : null
    };

    function create(options){
        var tabs = {};
        tabs.options = Object.assign({}, defaults, options);
        bind(tabs);
		tabs.init();
		return tabs;
    }

    function bind(tabs){
		tabs.init = init.bind(tabs);
        tabs.cacheDom = cacheDom.bind(tabs);
        tabs.attachEvents = attachEvents.bind(tabs);
        tabs.tabClick = tabClick.bind(tabs);
        tabs.showTab = showTab.bind(tabs);
        tabs.updateHash = updateHash.bind(tabs);
        tabs.hashChanged = hashChanged.bind(tabs);
    }

	function init(){
		this.cacheDom();
        this.attachEvents();
        if(this.options.hash){
            this.showTab(Util.getHashValue(tabs.options.hash) || 0);
        }else{
            this.showTab(0);
        }
	}

    function cacheDom(){
        this.dom = {};
        this.dom.root = this.options.root;
        this.dom.tabs = Array.from(this.dom.root.querySelectorAll(".tab"));
        this.dom.tabContents = Array.from(this.dom.root.querySelectorAll(".tab-content"));
    }

    function attachEvents(){
        this.dom.tabs.forEach(x => x.addEventListener("click", this.tabClick));
        window.addEventListener("hashchange", this.hashChanged);
    }

    function tabClick(e){
        var tabName = e.currentTarget.dataset.tab;
        this.showTab(tabName);
    }

    function showTab(tabName){
        this.dom.tabContents.forEach(x => x.classList.remove("selected"));
        this.dom.tabs.forEach(x => x.classList.remove("selected"));

        if(typeof(tabName) === "number"){
            tabName = this.dom.tabContents[tabName].dataset.tab;
        }

        this.dom.tabContents.filter(x => x.dataset.tab === tabName).forEach(x => x.classList.add("selected"));
        this.dom.tabs.filter(x => x.dataset.tab === tabName).forEach(x => x.classList.add("selected"));
        this.updateHash(tabName);
        this.options.onChange(tabName);
    }

    function updateHash(tabName){
        if(this.options.hash){
            let params = new URLSearchParams(window.location.hash.substr(1));
			let hash = params.get(this.options.hash);
            if(hash){
                window.location.href = window.location.href.replace(this.options.hash + "=" + hash, this.options.hash + "=" + tabName);
            }else if(window.location.hash.length > 0){
                window.location.href = window.location.href + "&" + this.options.hash + "=" + tabName;
            }else{
                window.location.href = window.location.href + "#" + this.options.hash + "=" + tabName;
            }
        }
    }

    function hashChanged(){
		let params = new URLSearchParams(window.location.hash.substr(1));
        let hash = params.get(this.options.hash);
        this.showTab(hash);
    }

    return {
        create : create
    };

})();
