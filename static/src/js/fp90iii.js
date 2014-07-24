openerp.fiscal_epos_print = function(instance) {

	posModule = instance.point_of_sale;

	posModule.PosWidget.include({
		build_widgets: function() {
			this._super();
			var self = this;
			this.close_fiscal = new posModule.HeaderButtonWidget(this, {
				label: instance.web._t('Chiusura fiscale'),
				action: function() {
					var p = new posModule.Driver();
					if ( confirm(instance.web._t('Effettuare davvero la chiusura fiscale?'))) {
						p.printFiscalReport();
						self.try_close();
					}
				},
			});
			this.close_fiscal.appendTo(this.$('#rightheader'));
		}
	});

	/*
	  There are probably about a thousand better ways to do this,
	  but the documentation on fiscal printers drivers is scarce.
	*/
	posModule.ProxyDevice.include({
		print_receipt: function(receipt) {
			var fp90 = new posModule.Driver();
			fp90.printFiscalReceipt(receipt);
		}
	});

	posModule.Driver = instance.web.Class.extend({
		init: function(options) {
			options = options || {};
			url = options.url || 'http://192.168.1.120/cgi-bin/fpmate.cgi';
			this.fiscalPrinter = new epson.fiscalPrint();
			this.fiscalPrinter.onreceive = function(res, tag_list_names, add_info) {
				console.log(res);
				console.log(tag_list_names);
				console.log(add_info);
			}
			this.fiscalPrinter.onerror = function() {
				alert('HTTP/timeout or other net error. This is not a fiscal printer internal error!');
			}
		},

		/*
		  Prints a sale item line.
		*/
		printRecItem: function(args) {
			tag = '<printRecItem'
				+ ' description="' + (args.description || '') + '"'
				+ ' quantity="' + (args.quantity || '1') + '"'
				+ ' unitPrice="' + (args.unitPrice || '') + '"'
				+ ' department="' + (args.department || '1') + '"'
				+ ' justification="' + (args.justification || '1') + '"'
				+ ' operator="' + (args.operator || '1') + '"'
				+ ' />';
			return tag;
		},

		/*
		  Adds a discount to the last line.
		*/
		printRecItemAdjustment: function(args) {
			tag = '<printRecItemAdjustment'
				+ ' operator="' + (args.operator || '1') + '"'
				+ ' adjustmentType="' + (args.adjustmentType || 0) + '"'
				+ ' description="' + (args.description || '' ) + '"'
				+ ' amount="' + (args.amount || '') + '"'
				// + ' department="' + (args.department || '') + '"'
				+ ' justification="' + (args.justification || '2') + '"'
				+ ' />';
			return tag;
		},

		/*
		  Prints a payment.
		*/
		printRecTotal: function(args) {
			tag = '<printRecTotal'
				+ ' operator="' + (args.operator || '1') + '"'
				+ ' description="' + (args.description || 'Pagamento') + '"'
				+ ' payment="' + (args.payment || '') + '"'
				+ ' paymentType="' + (args.paymentType || '0') + '"'
				+ ' />';
			return tag;
		},

		/*
		  Prints a receipt
		*/
		printFiscalReceipt: function(receipt) {
			var self = this;
			var xml = '<printerFiscalReceipt><beginFiscalReceipt />';
			_.each(receipt.orderlines, function(l, i, list) {
				xml += self.printRecItem({
					description: l.product_name,
					quantity: l.quantity,
					unitPrice: l.price,
				});
				if (l.discount) {
					xml += self.printRecItemAdjustment({
						adjustmentType: 0,
						description: 'Sconto ' + l.discount + '%',
						amount: l.quantity * l.price - l.price_display,
					});
				}
			});
			_.each(receipt.paymentlines, function(l, i, list) {
				xml += self.printRecTotal({
					payment: l.amount,
					paymentType: l.type,
					description: l.journal,
				});
			});
			xml += '<endFiscalReceipt /></printerFiscalReceipt>';
			this.fiscalPrinter.send(url, xml);
			console.log(xml);
		},

		printFiscalReport: function() {
			var xml = '<printerFiscalReport>';
			xml += '<displayText operator="1" data="Chiusura fiscale" />';
			xml += '<printZReport operator="1" />';
			xml += '</printerFiscalReport>';
			this.fiscalPrinter.send(url, xml);
		},

	});

	/*
	  Overwrite Paymentline.export_for_printing() in order
	  to make it export the payment type that must be passed
	  to the fiscal printer.
	*/
	var original = posModule.Paymentline.prototype.export_for_printing;
	posModule.Paymentline = posModule.Paymentline.extend({
		export_for_printing: function() {
			var res = original.apply(this, arguments);
			res.type = this.cashregister.get('journal').fiscalprinter_payment_type;
			return res;
		}
	});

}
