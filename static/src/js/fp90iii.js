function driver(instance) { //module is instance.point_of_sale

    // this object interfaces with the local proxy to communicate to the various hardware devices
    // connected to the Point of Sale. As the communication only goes from the POS to the proxy,
    // methods are used both to signal an event, and to fetch information. 

    instance.ProxyDevice = instance.web.Class.extend({
        init: function(options) {
            options = options || {};
            url = options.url || 'http://localhost:8069';
            
            this.weight = 0;
            this.weighting = false;
            this.debug_weight = 0;
            this.use_debug_weight = false;

            this.paying = false;
            this.default_payment_status = {
                status: 'waiting',
                message: '',
                payment_method: undefined,
                receipt_client: undefined,
                receipt_shop:   undefined,
            };    
            this.custom_payment_status = this.default_payment_status;

            this.connection = new instance.web.JsonRPC();
            this.connection.setup(url);
            this.connection.session_id = _.uniqueId('posproxy');
            this.bypass_proxy = false;
            this.notifications = {};
            
        },
		/*
		  Prints a sale item line.
		*/
		printRecItem: function(args) {
			tag = '<printRecItem'
				+ ' description="' + args.description || '' + '"'
				+ ' quantity="' + args.quantity || '' + '"'
				+ ' unitPrice="' + args.unitPrice || '' + '"'
				+ ' department="' + args.department || '' + '"'
				+ ' justification="' + args.justification || '' + '"'
				+ ' operator="' + args.operator + '"'
				+ ' />';
			console.log(tag);
		},

		/*
		  Adds a discount to the last line.
		*/
		printRecItemAdjustment: function(args) {
			tag = '<printRecItemAdjustment'
				+ ' operator="' + args.operator || '' + '"'
				+ ' adjustmentType="' + args.adjustmentType || 0 + '"'
				+ ' description="' + args.description || '' + '"'
				+ ' department="' + args.department || '' + '"'
				+ ' justification="' + args.justification || '' + '"'
				+ ' />';
			console.log(tag);
		},

		/*
		  Prints a payment.
		*/
		printRecTotal: function(args) {
			tag = '<printRecTotal'
				+ ' operator="' + args.operator || '' + '"'
				+ ' description="' + args.description || 'Grazie!' + '"'
				+ ' payment="' + args.payment || '' + '"'
				+ ' paymentType="' + args.paymentType || '' + '"'
				+ ' />';
			console.log(tag);
		},

		/*
		  Prints a receipt
		*/
		printFiscalReceipt: function(receipt) {
			_.each(receipt.orderlines, function(l, i, list) {
				this.printRecItem({
					description: l.product_name,
					quantity: l.quantity,
					unitPrice: l.price,
				});
				if (l.discount) {
					this.printRecItemAdjustment({
						adjustmentType: 0,
						description: 'Prova testo sconto',
						amount: l.discount,
					});
				}
			});
			_.each(receipt.paymentlines, function(l, i, list) {
				this.printRecTotal({
					payment: l.amount,
					paymentType: 0,
				});
			});
		},

    });

}
