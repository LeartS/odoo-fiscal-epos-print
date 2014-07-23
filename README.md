odoo-fiscal-epos-print
======================

Fiscal ePOS-Print JavaScript driver for Odoo.

This is a driver for using Fiscal ePOS-Print XML compatible devices with the
Odoo Point of Sale.

## Compatible devices (that I know of):
 * Epson FP-81 II
 * Epson FP-81 II S
 * Epson FP-90 III

## TODO
A lot. At the moment this is just a crude (but working for "normal" Italian receipts) effort.
* At the moment there is only basic support for `printerFiscalReceipt`, support for all other root elements is not yet implemented.
* Improve support for `printerFiscalReceipt`
* Think of a better way to integrate the driver into the point of sale (not overwriting `devices.js`)
* Even more..
