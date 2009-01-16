/*
 * Copyright (c) 2008-2009 Olle Törnström studiomediatech.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Jetinject is a very simple, small and able dependency injection-, 
 * application context- or bean factory-plugin for jQuery.
 * 
 * Wire an application context like this:
 *
 *    $.applicationContext({
 *       'myService' : {type : Service},
 *       'myView' : {type : View},
 *       'myWidget' : {type : Widget, props : {
 *          'service' : {ref : 'myService'},
 *          'view' : {ref : 'myView'}
 *       }}
 *    });
 *
 * And retreive a wired bean like this:
 *
 *    $.getBean('myWidget').do(...);
 *
 * @author Olle Törnström olle[at]studiomediatech[dot]com
 * @created 2008-11-17
 * @version 1.0.0-BETA
 * 
 * $Id$
 */
;(function($) {

	Bean = function(definition) {
		this.type = definition.type;
		this.args = definition.args || [];
		this.props = definition.props || {};
		this.scope = (/(prototype|singleton)/).test(definition.scope) ? definition.scope : 'singleton';
		return this;
	};
	Bean.prototype.wire = function(instance, context) {
		$.each(this.props || {}, function(prop, def) {
			if (typeof def.ref !== 'undefined') {
				instance[prop] = context.instances[def.ref];
			} else if (typeof def.type !== 'undefined') {
				def.scope = 'prototype';
				def.props = {};
				var innerBean = new Bean(def);
				var innerInstance = innerBean.getInstance();
				innerBean.wire(innerInstance, context);
				instance[prop] = innerInstance;
			}
		});
	};
	Bean.prototype.getInstance = function() {
		var obj = new this.type;
		this.type.apply(obj, this.args);
		return obj;
	};

	ApplicationContext = function(config) {
		var _beans = this.beans = {};
		var _instances = this.instances = {};	
		$.each(config || {}, function(id, definition) {
			var bean = new Bean(definition);
			_beans[id] = bean;
			if (bean.scope === 'singleton')
				_instances[id] = bean.getInstance();
		});
		var that = this;
		$.each(_instances, function(id, instance) {
			_beans[id].wire(instance, that);
		});
		return this;
	};
	ApplicationContext.prototype.getBean = function(id) {
		if (typeof this.beans[id] === 'undefined')
			return undefined;
		if (this.beans[id].scope === 'prototype') {
			var instance = this.beans[id].getInstance(true);
			this.beans[id].wire(instance, this);
			return instance;
		}
		return this.instances[id];
 	};
	
	var applicationContext;
	
	$.applicationContext = function(config) {
		applicationContext = new ApplicationContext(config);
	};
	
	$.getBean = function(name) {
		return applicationContext.getBean(name);
	};
})(jQuery);