odoo.define('product_multi_uom_pos.multi_uom',function(require) {
"use strict";

var gui = require('point_of_sale.gui');
var chrome = require('point_of_sale.chrome');
var PosBaseWidget = require('point_of_sale.BaseWidget');
var popups = require('point_of_sale.popups');
var core = require('web.core');
var models = require('point_of_sale.models');
var PosModelSuper = models.PosModel;
var pos_screens = require('point_of_sale.screens');
var Model = require('web.DataModel');
var QWeb = core.qweb;
var _t = core._t;

var MultiUomWidget = PosBaseWidget.extend({
    template: 'MultiUomWidget',
    init: function(parent, args) {
        this._super(parent, args);
        this.options = {};
        this.uom_list = [];
    },
    events: {
        'click .button.cancel':  'click_cancel',
        'click .button.confirm': 'click_confirm',
    },
    get_units_by_category: function(uom_list, categ_id){
        var uom_by_categ = []
        for (var uom in uom_list){
            if(uom_list[uom].category_id[0] == categ_id[0]){
                uom_by_categ.push(uom_list[uom]);
            }
        }
        return uom_by_categ;
    },
    show: function(options){
        options = options || {};
        var current_uom = this.pos.units_by_id[options.uom_list[0]];
        var uom_list = this.pos.units_by_id;
        var uom_by_category = this.get_units_by_category(uom_list, current_uom.category_id);
        this.uom_list = uom_by_category;
        this.current_uom = options.uom_list[0];
        this.renderElement();
//        this.uom_list = options.uom_list;
//        this.renderElement();
//        this.$('.name').focus();
    },
    close: function(){
        if (this.pos.barcode_reader) {
            this.pos.barcode_reader.restore_callbacks();
        }
    },
    click_confirm: function(){
        var self = this;

        var uom = parseInt(this.$('.uom').val());
        var order = self.pos.get_order();
        console.log("order", order)
        var orderline = order.get_selected_orderline();
        var selected_uom = this.pos.units_by_id[uom];
        orderline.product.uom_id[0] = uom;
        orderline.product.uom_id[1] = selected_uom.display_name;
//        console.log("-------", self.pos.get_order().get_selected_orderline())
        console.log("-------===", self.pos.get_order())
        order.remove_orderline(orderline);
        order.add_orderline(orderline);
//        order.trigger('change');
//        this.pos.bind('change:selectedOrder', this.change_selected_order, this);
        this.gui.close_popup();

    },
    click_cancel: function(){
        this.gui.close_popup();
    },
});
gui.define_popup({name:'multi_uom_screen', widget: MultiUomWidget});

pos_screens.ActionpadWidget.include({
    renderElement: function() {
        this._super();
        var self = this;
        console.log("----", self.pos.get_order().get_selected_orderline())
        this.$('.multi-uom-span').click(function(){
            console.log("----", self.pos.get_order().get_selected_orderline())
            var orderline = self.pos.get_order().get_selected_orderline();
            var options = {
                'uom_list': orderline.product.uom_id
            };
            self.gui.show_popup('multi_uom_screen', options);
        });
    }
});


/*models.load_models({
            model: 'pos.order',
            fields: ['id', 'name', 'session_id', 'pos_reference', 'partner_id', 'amount_total', 'amount_tax'],
            loaded: function (self, pos_orders) {
                var new_order_list = [];
                for (var i in pos_orders){
                    new_order_list[pos_orders[i].id] = pos_orders[i];
                }
                self.pos_orders = new_order_list;
            },
        });

var DomCache = core.Class.extend({
        init: function(options){
            options = options || {};
            this.max_size = options.max_size || 2000;

            this.cache = {};
            this.access_time = {};
            this.size = 0;
        },
        cache_node: function(key,node){
            var cached = this.cache[key];
            this.cache[key] = node;
            this.access_time[key] = new Date().getTime();
            if(!cached){
                this.size++;
                while(this.size >= this.max_size){
                    var oldest_key = null;
                    var oldest_time = new Date().getTime();
                    for(key in this.cache){
                        var time = this.access_time[key];
                        if(time <= oldest_time){
                            oldest_time = time;
                            oldest_key  = key;
                        }
                    }
                    if(oldest_key){
                        delete this.cache[oldest_key];
                        delete this.access_time[oldest_key];
                    }
                    this.size--;
                }
            }
            return node;
        },
        clear_node: function(key) {
            var cached = this.cache[key];
            if (cached) {
                delete this.cache[key];
                delete this.access_time[key];
                this.size --;
            }
        },
        get_node: function(key){
            var cached = this.cache[key];
            if(cached){
                this.access_time[key] = new Date().getTime();
            }
            return cached;
        },
    });
chrome.OrderSelectorWidget.include({
    renderElement: function(){
        var self = this;
        this._super();
        this.$('.orders-list').click(function(event){
            self.gui.show_screen('OldOrdersWidget');
        });
    },
});

models.PosModel = models.PosModel.extend({
    _save_to_server: function (orders, options) {
        var result_new = PosModelSuper.prototype._save_to_server.call(this, orders, options);
        var self = this;
        var new_order = {};
        var order_list = self.pos_orders;
        for (var i in orders) {
            var partners = self.partners;
            var partner = "";
            for(var j in partners){
                if(partners[j].id == orders[i].data.partner_id){
                    partner = partners[j].name;
                }
            }
            new_order = {
                'amount_tax': orders[i].data.amount_tax,
                'amount_total': orders[i].data.amount_total,
                'pos_reference': orders[i].data.name,
                'partner_id': [orders[i].data.partner_id, partner],
                'session_id': [
                    self.pos_session.id, self.pos_session.name
                ]
            };
            order_list.push(new_order);
            self.pos_orders = order_list;
            self.gui.screen_instances.OldOrdersWidget.render_list(order_list);
        }
        return result_new;
    },
});

var OldOrdersWidget = pos_screens.ScreenWidget.extend({
    template: 'OldOrdersWidget',

    init: function(parent, options){
        this._super(parent, options);
        this.order_cache = new DomCache();
        this.order_string = "";
        this.pos_reference = "";
    },

    auto_back: true,
    renderElement: function () {
        this._super(this);
        var self = this;
        console.log("self===", self)
        this.$('.button.print').click(function(){
            if (!self._locked) {
                self.gui.screen_instances.OldOrdersWidget.print();
            }
            new Model('pos.order').call('get_details',[self.pos_reference]).then(function(id){
                self.chrome.do_action('order_reprinting_pos.pos_receipt_report',{additional_context:{
                    active_ids:[id],
                }});
            });
        });
    },

    show: function(){
        var self = this;
        this._super();

        this.renderElement();
        this.details_visible = false;

        this.$('.back').click(function(){
            self.gui.back();
        });
        var pos_orders = this.pos.pos_orders;
        this.render_list(pos_orders);


        var search_timeout = null;

        if(this.pos.config.iface_vkeyboard && this.chrome.widget.keyboard){
            this.chrome.widget.keyboard.connect(this.$('.searchbox input'));
        }

        this.$('.searchbox input').on('keypress',function(event){
            clearTimeout(search_timeout);

            var query = this.value;
            search_timeout = setTimeout(function(){
                self.perform_search(query,event.which === 13);
            },70);
        });

        this.$('.searchbox .search-clear').click(function(){
            self.clear_search();
        });
    },
    *//*lock_screen: function(locked) {
        this._locked = locked;
        if (locked) {
            this.$('.next').removeClass('highlight');
        } else {
            this.$('.next').addClass('highlight');
        }
    },
    print_web: function() {
        window.print();
        this.pos.get_order()._printed = true;
    },
    print_xml: function() {
        var env = {
            widget:  this,
            pos: this.pos,
            order: this.pos.get_order(),
            receipt: this.pos.get_order().export_for_printing(),
            paymentlines: this.pos.get_order().get_paymentlines()
        };
        var receipt = QWeb.render('XmlReceipt',env);

        this.pos.proxy.print_receipt(receipt);
        this.pos.get_order()._printed = true;
    },
    print: function() {
        var self = this;

        if (!this.pos.config.iface_print_via_proxy) { // browser (html) printing

            // The problem is that in chrome the print() is asynchronous and doesn't
            // execute until all rpc are finished. So it conflicts with the rpc used
            // to send the orders to the backend, and the user is able to go to the next
            // screen before the printing dialog is opened. The problem is that what's
            // printed is whatever is in the page when the dialog is opened and not when it's called,
            // and so you end up printing the product list instead of the receipt...
            //
            // Fixing this would need a re-architecturing
            // of the code to postpone sending of orders after printing.
            //
            // But since the print dialog also blocks the other asynchronous calls, the
            // button enabling in the setTimeout() is blocked until the printing dialog is
            // closed. But the timeout has to be big enough or else it doesn't work
            // 1 seconds is the same as the default timeout for sending orders and so the dialog
            // should have appeared before the timeout... so yeah that's not ultra reliable.

            this.lock_screen(true);

            setTimeout(function(){
                self.lock_screen(false);
            }, 1000);

            this.print_web();
        } else {    // proxy (xml) printing
            this.print_xml();
            this.lock_screen(false);
        }
    },*//*
    hide: function () {
        this._super();
        this.new_client = null;
    },
    perform_search: function(query, associate_result){
        var new_orders;
        if(query){
            new_orders = this.search_order(query);

            this.render_list(new_orders);
        }else{
            var orders = this.pos.pos_orders;
            this.render_list(orders);
        }
    },
    search_order: function(query){
        var self = this;
        try {
            query = query.replace(/[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g,'.');
            query = query.replace(' ','.+');
            var re = RegExp("([0-9]+):.*?"+query,"gi");
        }catch(e){
            return [];
        }
        var results = [];
        for(var i = 0; i < Math.min(self.pos.pos_orders.length,1000); i++){
            var r = re.exec(this.order_string);
            if(r){
                var id = Number(r[1]);
                results.push(this.get_order_by_id(id));
            }else{
                break;
            }
        }
        return results;
    },
    // returns the order with the id provided
    get_order_by_id: function (id) {
        return this.pos.pos_orders[id];
    },
    clear_search: function(){
        var orders = this.pos.pos_orders;
        this.render_list(orders);
        this.$('.searchbox input')[0].value = '';
        this.$('.searchbox input').focus();
    },
    render_list: function(orders){
        var self = this;
        for(var i = 0, len = Math.min(orders.length,1000); i < len; i++) {
            if (orders[i]) {
                var order = orders[i];
                self.order_string += i + ':' + order.pos_reference + '\n';
            }
        }

        this.$('.order-list-contents').delegate('.print-button','click',function(event){
            var pos_ref = $(this).data('id');
            var order_new = null;
            for(var i = 0, len = Math.min(orders.length,1000); i < len; i++) {
                if (orders[i] && orders[i].pos_reference == pos_ref) {
                    order_new = orders[i];
                }
            }
            $('span.searchbox').css('display', 'none');
            $('.button.print').css('display', 'block');
            var lines = [];
            var payments = [];
            var discount = 0;
            new Model('pos.order').call('get_orderlines',[order_new.pos_reference]).then(function(result){
                lines = result[0];
                payments = result[2];
                discount = result[1];
                self.gui.show_screen('OldOrdersWidget');
                self.$('.window').html(QWeb.render('PosTicketOld',{
                    widget:self,
                    order: order_new,
                    change: result[3],
                    orderlines: lines,
                    discount_total: discount,
                    paymentlines: payments,
                }));
                self.pos_reference = order_new.pos_reference;
            });
        });
        
        var contents = this.$el[0].querySelector('.order-list-contents');
        if (contents){
            contents.innerHTML = "";
            for(var i = 0, len = Math.min(orders.length,1000); i < len; i++) {
                if (orders[i]) {
                    var order = orders[i];

                    var orderline = this.order_cache.get_node(order.id);
                    if (!orderline) {
                        var clientline_html = QWeb.render('OrderLine', {widget: this, order: order});
                        var orderline = document.createElement('tbody');
                        orderline.innerHTML = clientline_html;
                        orderline = orderline.childNodes[1];
                        if (order.id){
                            this.order_cache.cache_node(order.id, orderline);
                        }
                        else{
                            this.order_cache.cache_node(i, orderline);
                        }
                    }
                    contents.appendChild(orderline);
                }
            }
        }
    },
    
    close: function(){
        this._super();
    },
});
gui.define_screen({name:'OldOrdersWidget', widget: OldOrdersWidget});*/


});