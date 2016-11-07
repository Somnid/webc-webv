const Bndr = (function(){

	const defaults = {
		template : null,
		bindings : null,
		model : null
	};

	function create(options){
		var bndr = {};
		bndr.options = Object.assign({}, defaults, options);
		bind(bndr);
		bndr.init();
		return bndr;
	}

	function bind(bndr){
		bndr.init = init.bind(bndr);
		bndr.attach = attach.bind(bndr);
		bndr.attachTo = attachTo.bind(bndr);
		bndr.remove = remove.bind(bndr);
		bndr.updateBinding = updateBinding.bind(bndr);
		bndr.updateElement = updateElement.bind(bndr);
		bndr.updateAttribute = updateAttribute.bind(bndr);
		bndr.updateAttributeExistence = updateAttributeExistence.bind(bndr);
		bndr.updateStyle = updateStyle.bind(bndr);
		bndr.updateClass = updateClass.bind(bndr);
		bndr.updateEvent = updateEvent.bind(bndr);
		bndr.setTemplate = setTemplate.bind(bndr);
		bndr.setModel = setModel.bind(bndr);
		bndr.onPropertySet = onPropertySet.bind(bndr);
		bndr.triggerUpdate = triggerUpdate.bind(bndr);
		bndr.getBoundModel = getBoundModel.bind(bndr);
		bndr.query = query.bind(bndr);
		bndr.attachUpdateEvent = attachUpdateEvent.bind(bndr);

		bndr.setListModel = setListModel.bind(bndr);
		bndr.setListTemplate = setListTemplate.bind(bndr);
		bndr.attachListTo = attachListTo.bind(bndr);
		bndr.onPush = onPush.bind(bndr);
		bndr.onPop = onPop.bind(bndr);
		bndr.pushArrayElement = pushArrayElement.bind(bndr);
		bndr.popArrayElement = popArrayElement.bind(bndr);

		bndr.bindElement = bindElement.bind(bndr);
		bndr.bindElementTwoWay = bindElementTwoWay.bind(bndr);
		bndr.bindElementTwoWay = bindElementTwoWay.bind(bndr);
		bndr.bindStyle = bindStyle.bind(bndr);
		bndr.bindAttribute = bindAttribute.bind(bndr);
		bndr.bindAttributeExistence = bindAttributeExistence.bind(bndr);
		bndr.bindAttributeExistenceReversed = bindAttributeExistenceReversed.bind(bndr);
		bndr.bindClass = bindClass.bind(bndr);
		bndr.bindClassReversed = bindClassReversed.bind(bndr);
		bndr.bindEvent = bindEvent.bind(bndr);
	}

	function init(){
		this.model = {};
		this.model.bindings = this.options.bindings || [];
		this.model.events = new Map();
		this.model.attachment = null;
		this.setTemplate(this.options.template);
		this.setModel(this.options.model || {});
	}

	function attachTo(element){
		if(Array.isArray(this.model.model)){
			this.attachListTo(element);
		}else{
			this.updateBinding(this.model.bindings);
			if(this.model.domRoot){
				element.appendChild(this.model.domRoot);
			}
		}
		this.model.attachment = element;
		return this;
	}

	function attach(){
	  if(this.model.domRoot instanceof DocumentFragment){
	    return console.error("Can only direct attach if template is a non-template node");
	  }
	  if(Array.isArray(this.model.model)){
			//dunno
		}else{
			this.updateBinding(this.model.bindings);
		}
		this.model.attachment = this.model.domRoot.parentNode;
		return this;
	}

	function attachListTo(element){
		this.model.bndrs.forEach(x => x.attachTo(element));
	}

	function remove(){
		this.model.elements.forEach(x => x.parentNode.removeChild(x));
	}

	function updateBinding(bindings){
		[].concat(bindings).forEach(binding => {
			var elements = queryElementsInList(this.model.elements, binding.selector);

			if(binding.type == "element"){
				this.updateElement(elements, binding.accessor, binding.updatesModel);
			}else if(binding.type === "style"){
				this.updateStyle(elements, binding.accessor, binding.style);
			}else if(binding.type === "attribute"){
				this.updateAttribute(elements, binding.accessor, binding.attribute);
			}else if(binding.type === "attribute-existence"){
				this.updateAttributeExistence(elements, binding.accessor, binding.attribute, binding.reversed);
			}else if(binding.type === "class"){
			  this.updateClass(elements, binding.accessor, binding.klass, binding.reversed);
			}else if(binding.type === "event"){
			  this.updateEvent(elements, binding.eventName, binding.handler);
			}
		});
	}

	function updateElement(elements, accessor, updatesModel){
		var value = access(this.model.model, accessor);
		[].concat(elements).forEach(x => {
			setElement(x, value);
			if(updatesModel){
				this.attachUpdateEvent(x, accessor);
			}
		});
	}

	function updateStyle(elements, accessor, style){
		var value = access(this.model.model, accessor);
		[].concat(elements).forEach(x => setStyle(x, style, value));
	}

	function updateAttribute(elements, accessor, attribute){
		var value = access(this.model.model, accessor);
		[].concat(elements).forEach(x => setAttribute(x, attribute, value));
	}

	function updateAttributeExistence(elements, accessor, attribute, reversed){
		var value = access(this.model.model, accessor);
		[].concat(elements).forEach(x => setAttributeExistence(x, attribute, value, reversed));
	}

	function updateClass(elements, accessor, klass, reversed){
		var value = access(this.model.model, accessor);
		[].concat(elements).forEach(x => setClass(x, klass, value, reversed));
	}

	function updateEvent(elements, eventName, handler){
		[].concat(elements).forEach(x => attachEvent(x, eventName, handler, this.model.events));
	}

	function bindElement(selector, accessor){
		this.model.bindings.push({
			accessor : accessor,
			selector : selector,
			type : "element",
			updatesModel : false
		});
		return this;
	}

	function bindElementTwoWay(selector, accessor){
		this.model.bindings.push({
			accessor : accessor,
			selector : selector,
			type : "element",
			updatesModel : true
		});
		return this;
	}

	function bindStyle(selector, accessor, style){
		this.model.bindings.push({
			accessor : accessor,
			selector : selector,
			style : style,
			type : "style"
		});
		return this;
	}

	function bindAttribute(selector, accessor, attribute){
		this.model.bindings.push({
			accessor : accessor,
			selector : selector,
			attribute : attribute,
			type : "attribute"
		});
		return this;
	}

	function bindAttributeExistence(selector, accessor, attribute){
	  	this.model.bindings.push({
			accessor : accessor,
			selector : selector,
			attribute : attribute,
			type : "attribute-existence",
			reversed : false
		});
		return this;
	}

	function bindAttributeExistenceReversed(selector, accessor, attribute){
	  	this.model.bindings.push({
			accessor : accessor,
			selector : selector,
			attribute : attribute,
			type : "attribute-existence",
			reversed : true
		});
		return this;
	}

	function bindClass(selector, accessor, klass){
		this.model.bindings.push({
			accessor : accessor,
			selector : selector,
			klass : klass,
			type : "class",
			reversed : false
		});
		return this;
	}

	function bindClassReversed(selector, accessor, klass){
		this.model.bindings.push({
			accessor : accessor,
			selector : selector,
			klass : klass,
			type : "class",
			reversed : true
		});
		return this;
	}

	function bindEvent(selector, eventName, handler){
		this.model.bindings.push({
			eventName : eventName,
			selector : selector,
			handler : handler,
			type : "event"
		});
		return this;
	}

	function setTemplate(template){
		if(Array.isArray(this.model.model)){
			this.setListTemplate(template);
		}else{
			this.model.template = template;
			this.model.domRoot = getTemplate(template);
			this.model.elements = getDocfragChildList(this.model.domRoot);
			this.updateBinding(this.model.bindings);
		}

		if(this.model.attachment){
			this.attachTo(this.model.attachment);
		}

		return this;
	}

	function setListTemplate(template){
		this.model.bndrs.forEach(x => x.setTemplate(template));
	}

	function setModel(model){
		if(Array.isArray(model)){
			model = this.setListModel(model);
		}
		this.model.model = new Proxy(model, {
			set : this.onPropertySet
		});
		this.updateBinding(this.model.bindings);

		return this;
	}

	function setListModel(listModel){
		this.model.bndrs = [];
		listModel.forEach(x => {
			this.model.bndrs.push(create({
				model : x,
				template : this.model.template,
				bindings : this.model.bindings
			}));
		});
		listProxy = this.model.bndrs.map(x => x.getBoundModel());
		listProxy.push = new Proxy(listProxy.push, {
			apply : this.onPush
		});
		listProxy.pop = new Proxy(listProxy.pop, {
			apply : this.onPop
		});
		return listProxy;
		}

	function getBoundModel(){
		return this.model.model;
	}

	function query(selector){
		return queryElementsInList(this.elements, selector);
	}

	function onPropertySet(model, propertyName, newValue){
		if(model[propertyName] !== newValue){
			if(Array.isArray(model) && isNumber(propertyName) && propertyName < model.length){ //array element
				newValue = this.model.bndrs[propertyName].setModel(value).getBoundModel();
			}
			Reflect.set(model, propertyName, newValue);
			this.triggerUpdate(propertyName);
		}
		return true;
	}

	function onPush(target, thisArgument, argumentList){
		var model = this.pushArrayElement(argumentList[0]);
		Reflect.apply(target, thisArgument, [model]);
	}

	function onPop(target, thisArgument, argumentList){
		var model = this.popArrayElement(argumentList[0]);
		Reflect.apply(target, thisArgument, [model]);
	}

	function pushArrayElement(value){
		var bndr = create({
		  model : value,
	  	template : this.model.template,
		  bindings : this.model.bindings
	  });
		this.model.bndrs.push(bndr);
		model = bndr.getBoundModel();
		if(this.model.attachment){
			bndr.attachTo(this.model.attachment);
		}
		return model;
	}

	function popArrayElement(){
		var model = this.model.bndrs.pop();
		model.remove();
	}

	function triggerUpdate(propertyName){
		var bindings = this.model.bindings.filter(x => x.accessor && getTopLevelProperty(x.accessor) == propertyName);
		this.updateBinding(bindings);
	}

	//Static Methods
	function getTemplate(templateElement){
		if(!templateElement){
			return null;
		}
		if(templateElement.tagName == "TEMPLATE"){
			return document.importNode(templateElement.content, true);
		}
		return templateElement;
	}

	function getDocfragChildList(docfrag){
		if(!docfrag){
			return [];
		}
		var list = [];
		for(var i = 0; i < docfrag.children.length; i++){
			list.push(docfrag.children[i]);
		}
		return list;
	}

	function boolOrDefault(value, defaultValue){
		if(value == "boolean"){
			return value;
		}else if(!value){
			return defaultValue;
		}
		return true;
	}

	function isNumber(value) {
		return !isNaN(value-0) && value !== null && value !== "" && value !== false;
	}

	function getTopLevelProperty(accessor){
		if(accessor.includes(".")){
			return accessor.split(".")[0];
		}
		return accessor;
	}

	function access(obj, accessor){
		if(!obj || !accessor){
			return null;
		}

		let keys = accessor.split(".");
		let prop = obj;
		for(let i = 0; i < keys.length; i++){
			if(keys[i] !== undefined && keys[i] !== ""){
				if(prop !== null && prop[keys[i]] !== undefined){
					prop = prop[keys[i]];
				}else{
					return null;
				}
			}
		}
		return prop;
	}

	function setObjectProp(obj, accessor, value){
		let keys = accessor.split(".");
		let prop = obj;
		for(let i = 0; i < keys.length-1; i++){
			if(keys[i] !== undefined){
				if(prop[keys[i]] !== undefined){
					prop = prop[keys[i]];
				}else{
					console.error("Could not find property:", obj, accessor);
				}
			}
		}
		if(prop[keys[keys.length-1]] !== undefined){
			prop[keys[keys.length-1]] = value;
		}else{
			console.error("Could not find property:", obj, accessor);
		}
	}

	function getFromMapTree(map, ...accessors){
		let value = map;
		for(var i = 0; i < accessors.length; i++){
			if(value.has(accessors[i])){
				value = value.get(accessors[i]);
			}else{
				return null;
			}
		}
		return value;
	}

	function setToMapTree(map, ...accessors){
    	for(var i = 0; i < accessors.length - 1; i++){
    		if(i === accessors.length - 2){
    			map.set(accessors[i], accessors[i + 1]);
			}
			if(map.has(accessors[i])){
				map = map.get(accessors[i]);
	    	}else{
	    		let newMap = new Map();
	    		map.set(accessors[i], newMap);
	    		map = newMap;
	    	}
		}
	}

	function queryElementsInList(elements, selector){
		var matchingElements = [];

		if(!elements){
			return [];
		}

		for(var i = 0; i < elements.length; i++){
			var foundElements = elements[i].parentNode.querySelectorAll(selector); //need parent because this can include self
			if(foundElements.length > 0){
				for(var j = 0; j < foundElements.length; j++){
					if(isAncestorOrSelf(elements[i], foundElements[j])){ //check that we didn't find on some unrelated branch off parent
						matchingElements.push(foundElements[j]);
					}
				}
			}
		}
		return matchingElements;
	}

	function isAncestorOrSelf(thisNode, nodeToTest){
		while(thisNode != nodeToTest){
			if(nodeToTest.parentNode){
				nodeToTest = nodeToTest.parentNode;
			}else{
				return false;
			}
		}
		return true;
	}

	const inputEventMap = {
		"TEXT" : "input",
		"CHECKBOX" : "change",
		"TEXTAREA" : "input",
		"SELECT" : "change"
	};
	const inputValueMap = {
		"TEXT" : "value",
		"CHECKBOX" : "checked",
		"TEXTAREA" : "value",
		"SELECT" : "value",
		"*" : "textContent"
	};

	function setElement(element, value){
		var elementType =  element.tagName.toUpperCase();
		element[getInputElementMappedValue(element, inputValueMap)] = value;
	}

	function setStyle(element, style, value){
		element.style[style] = value;
	}

	function setAttribute(element, attribute, value){
		element.setAttribute(attribute, value);
	}

	function setAttributeExistence(element, attribute, value, reversed){
		if((!reversed && !!value) || (reversed && !value)){
    		element.setAttribute(attribute, "");
    	}else{
    		element.removeAttribute(attribute);
    	}
	}

	function setClass(element, klass, value, reversed){
	  if(!reversed && !!value || (reversed && !value)){
		  element.classList.add(klass);
	  }else{
	    element.classList.remove(klass);
	  }
	}

	function getInputElementMappedValue(element, map){
		let elementType = element.tagName.toUpperCase();
		let result;
		if(elementType === "INPUT"){
			result = map[element.type.toUpperCase()];
		}else{
			result = map[elementType];
		}
		if(!result){
			result = map["*"];
		}
		return result;
	}

	function attachUpdateEvent(element, accessor){
		let eventName = getInputElementMappedValue(element, inputEventMap);
		let handler = updateHandler.bind(this, element, accessor);
		handler.boundFrom = updateHandler; //gives us a handle to the original for equality testing
		attachEvent(element, eventName, handler, this.model.events);
	}

	function updateHandler(element, accessor){
		let value = element[getInputElementMappedValue(element, inputValueMap)];
		setObjectProp(this.model.model, accessor, value);
	}

	function attachEvent(element, eventName, handler, events){
		let storedHandler = getFromMapTree(events, element, eventName);
		if(handler === storedHandler || handler.boundFrom === storedHandler){
			return;
		}
	    element.addEventListener(eventName, handler);
	    setToMapTree(events, element, eventName, handler.boundFrom ? handler.boundFrom : handler);
	}

	return {
		create: create
	};

})();
