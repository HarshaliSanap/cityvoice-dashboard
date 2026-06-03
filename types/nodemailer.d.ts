declare module "nodemailer" {
  type TransportOptions = {
    auth?: {
      pass?: string;
      user?: string;
    };
    host?: string;
    port?: number;
    secure?: boolean;
  };

  type MailOptions = {
    from?: string;
    html?: string;
    subject?: string;
    text?: string;
    to?: string;
  };

  type Transporter = {
    sendMail(options: MailOptions): Promise<unknown>;
  };

  const nodemailer: {
    createTransport(options: TransportOptions): Transporter;
  };

  export default nodemailer;
}
