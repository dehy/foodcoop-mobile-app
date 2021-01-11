import { Base64 } from 'js-base64';
import Config from 'react-native-config';
import * as RNFS from 'react-native-fs';
import * as mime from 'react-native-mime-types';
import AppLogger from './AppLogger';

export interface Message {
    From: Contact;
    To: Contact[];
    Cc?: Contact[];
    Bcc?: Contact[];
    Subject: string;
    TextPart?: string;
    HtmlPart?: string;
    Attachments?: MailAttachment[];
}

export interface Contact {
    email: string;
    name?: string;
}

export interface MailAttachment {
    ContentType: string;
    Filename: string;
    Base64Content: string;
}

export default class Mailjet {
    private static instance: Mailjet;
    private publicApiKey = Config.MAILJET_PUBLIC_API_KEY;
    private privateapiKey = Config.MAILJET_PRIVATE_API_KEY;
    private senderEmail = Config.MAIL_FROM;
    private senderName?: string;

    public static async filepathToAttachment(
        filepath: string,
        filename?: string,
        filetype?: string,
        charset?: string,
    ): Promise<MailAttachment> {
        filename = filename || filepath.split('/').pop();
        const contentType = filetype || mime.lookup(filepath);
        const finalCharset = charset || mime.charset(filepath);
        const base64Content = await Base64.encode(await RNFS.readFile(filepath, finalCharset ?? 'utf8'));

        if (!filename) {
            throw 'Filename not found. Please specify it explicitly';
        }
        if (!contentType) {
            throw 'Content-Type not found. Please specifcy it explicitly';
        }

        return {
            ContentType: contentType,
            Filename: filename,
            Base64Content: base64Content,
        };
    }

    public static getInstance(): Mailjet {
        if (Mailjet.instance == undefined) {
            Mailjet.instance = new Mailjet();
        }
        return this.instance;
    }

    public setSender(name?: string): void {
        this.senderName = name;
    }

    public send = async (messages: Message[]): Promise<any> => {
        const messagesString = JSON.stringify({ Messages: messages });
        const options: RequestInit = {
            method: 'POST',
            body: messagesString,
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Basic ' + Base64.encode(this.publicApiKey + ':' + this.privateapiKey),
            },
        };
        const response = await fetch('https://api.mailjet.com/v3.1/send', options);
        const json: any = await response.json();
        AppLogger.getLogger().info(`Mailjet response: ${JSON.stringify(json)}`);
        if (json.hasOwnProperty('ErrorCode')) {
            throw json;
        }
        if (json.hasOwnProperty('Messages')) {
            json.Messages.forEach((message: any) => {
                if (message.hasOwnProperty('Status')) {
                    if ('error' === message.Status) {
                        throw json;
                    }
                }
            });
        }
        return json;
    };

    async sendEmail(
        to: string,
        cc: string,
        subject: string,
        body: string,
        attachments: MailAttachment[] = [],
    ): Promise<void> {
        if (!this.senderEmail) {
            throw 'Missing sender email. Set it with `setSender(email, name)`';
        }

        const message: Message = {
            From: {
                email: this.senderEmail,
                name: `${this.senderName} (App Mobile)`,
            },
            To: [
                {
                    email: __DEV__ ? this.senderEmail : to,
                },
            ],
            Subject: subject = __DEV__ ? '[Test] ' + subject : subject,
            TextPart: body,
        };
        if (!__DEV__) {
            if (cc) {
                message.Cc = [
                    {
                        email: cc,
                    },
                ];
            }
        }
        if (attachments && attachments.length > 0) {
            message.Attachments = attachments;
        }
        await this.send([message]);
    }
}
