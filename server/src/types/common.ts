interface Message {
    role: "user" | "assistant";
    content: string;
  }
  
export interface ConversationData {
    messages: Message[];
  }

  export type PostFile = {
    id: string;
    url: string;
  };

export type Mention = {
  type: "project" | "employee";
  id: string;
}