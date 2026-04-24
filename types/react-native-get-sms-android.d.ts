declare module "react-native-get-sms-android" {
  export interface SmsFilter {
    box?: "inbox" | "sent" | "draft" | "outbox" | "failed" | "queued";
    minDate?: number;
    maxDate?: number;
    bodyRegex?: string;
    address?: string;
    read?: 0 | 1;
    _id?: string;
    thread_id?: string;
    indexFrom?: number;
    maxCount?: number;
  }

  export interface SmsMessage {
    _id: string;
    thread_id: string;
    address: string;
    person: string | null;
    date: string;
    date_sent: string;
    read: string;
    body: string;
    type: string;
    locked: string;
    sub_id: string;
    seen: string;
  }

  const SmsAndroid: {
    list: (
      filter: string,
      fail: (error: string) => void,
      success: (count: number, smsList: string) => void
    ) => void;
  };

  export default SmsAndroid;
}
