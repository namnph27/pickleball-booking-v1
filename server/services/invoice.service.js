const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Invoice Service
 */
class InvoiceService {
  constructor() {
    this.invoiceDir = path.join(__dirname, '../public/invoices');
    
    // Create invoices directory if it doesn't exist
    if (!fs.existsSync(this.invoiceDir)) {
      fs.mkdirSync(this.invoiceDir, { recursive: true });
    }
    
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  
  /**
   * Generate invoice PDF
   * @param {Object} invoiceData - Invoice data
   * @param {string} invoiceData.invoiceNumber - Invoice number
   * @param {string} invoiceData.date - Invoice date
   * @param {Object} invoiceData.customer - Customer information
   * @param {Object} invoiceData.booking - Booking information
   * @param {Object} invoiceData.payment - Payment information
   * @returns {Promise<string>} Invoice file path
   */
  async generateInvoice(invoiceData) {
    try {
      const {
        invoiceNumber,
        date,
        customer,
        booking,
        payment
      } = invoiceData;
      
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Add a page to the document
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      
      // Get fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Set page margins
      const margin = 50;
      const width = page.getWidth() - 2 * margin;
      
      // Draw header
      page.drawText('PICKLEBALL BOOKING', {
        x: margin,
        y: page.getHeight() - margin,
        size: 24,
        font: boldFont,
        color: rgb(0, 0.5, 0.8)
      });
      
      page.drawText('INVOICE', {
        x: margin,
        y: page.getHeight() - margin - 40,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      // Draw invoice details
      page.drawText(`Invoice Number: ${invoiceNumber}`, {
        x: margin,
        y: page.getHeight() - margin - 80,
        size: 12,
        font: font
      });
      
      page.drawText(`Date: ${new Date(date).toLocaleDateString()}`, {
        x: margin,
        y: page.getHeight() - margin - 100,
        size: 12,
        font: font
      });
      
      // Draw customer information
      page.drawText('Customer Information', {
        x: margin,
        y: page.getHeight() - margin - 140,
        size: 14,
        font: boldFont
      });
      
      page.drawText(`Name: ${customer.name}`, {
        x: margin,
        y: page.getHeight() - margin - 160,
        size: 12,
        font: font
      });
      
      page.drawText(`Email: ${customer.email}`, {
        x: margin,
        y: page.getHeight() - margin - 180,
        size: 12,
        font: font
      });
      
      // Draw booking information
      page.drawText('Booking Information', {
        x: margin,
        y: page.getHeight() - margin - 220,
        size: 14,
        font: boldFont
      });
      
      page.drawText(`Booking ID: ${booking.id}`, {
        x: margin,
        y: page.getHeight() - margin - 240,
        size: 12,
        font: font
      });
      
      page.drawText(`Court: ${booking.court_name}`, {
        x: margin,
        y: page.getHeight() - margin - 260,
        size: 12,
        font: font
      });
      
      page.drawText(`Date: ${new Date(booking.start_time).toLocaleDateString()}`, {
        x: margin,
        y: page.getHeight() - margin - 280,
        size: 12,
        font: font
      });
      
      page.drawText(`Time: ${new Date(booking.start_time).toLocaleTimeString()} - ${new Date(booking.end_time).toLocaleTimeString()}`, {
        x: margin,
        y: page.getHeight() - margin - 300,
        size: 12,
        font: font
      });
      
      // Draw payment information
      page.drawText('Payment Information', {
        x: margin,
        y: page.getHeight() - margin - 340,
        size: 14,
        font: boldFont
      });
      
      page.drawText(`Payment ID: ${payment.id}`, {
        x: margin,
        y: page.getHeight() - margin - 360,
        size: 12,
        font: font
      });
      
      page.drawText(`Payment Method: ${payment.payment_method}${payment.payment_gateway ? ` (${payment.payment_gateway})` : ''}`, {
        x: margin,
        y: page.getHeight() - margin - 380,
        size: 12,
        font: font
      });
      
      page.drawText(`Transaction ID: ${payment.transaction_id || 'N/A'}`, {
        x: margin,
        y: page.getHeight() - margin - 400,
        size: 12,
        font: font
      });
      
      page.drawText(`Status: ${payment.status}`, {
        x: margin,
        y: page.getHeight() - margin - 420,
        size: 12,
        font: font
      });
      
      // Draw amount
      page.drawText('Amount', {
        x: margin,
        y: page.getHeight() - margin - 460,
        size: 14,
        font: boldFont
      });
      
      page.drawText(`Total: ${payment.amount.toLocaleString()} VND`, {
        x: margin,
        y: page.getHeight() - margin - 480,
        size: 16,
        font: boldFont,
        color: rgb(0, 0.5, 0)
      });
      
      // Draw footer
      page.drawText('Thank you for using Pickleball Booking!', {
        x: margin,
        y: margin + 60,
        size: 12,
        font: font
      });
      
      page.drawText('This is an electronically generated invoice and does not require a signature.', {
        x: margin,
        y: margin + 40,
        size: 10,
        font: font
      });
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create file path
      const filePath = path.join(this.invoiceDir, `${invoiceNumber}.pdf`);
      
      // Write the PDF to disk
      fs.writeFileSync(filePath, pdfBytes);
      
      return filePath;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }
  
  /**
   * Send invoice by email
   * @param {Object} emailData - Email data
   * @param {string} emailData.to - Recipient email
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.text - Email text
   * @param {string} emailData.invoicePath - Invoice file path
   * @returns {Promise<Object>} Email send result
   */
  async sendInvoiceByEmail(emailData) {
    try {
      const {
        to,
        subject,
        text,
        invoicePath
      } = emailData;
      
      // Create email options
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        attachments: [
          {
            filename: path.basename(invoicePath),
            path: invoicePath
          }
        ]
      };
      
      // Send email
      const result = await this.transporter.sendMail(mailOptions);
      
      return result;
    } catch (error) {
      console.error('Error sending invoice by email:', error);
      throw error;
    }
  }
  
  /**
   * Get invoice URL
   * @param {string} invoiceNumber - Invoice number
   * @returns {string} Invoice URL
   */
  getInvoiceUrl(invoiceNumber) {
    return `/invoices/${invoiceNumber}.pdf`;
  }
}

module.exports = new InvoiceService();
