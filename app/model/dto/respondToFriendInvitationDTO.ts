export interface RespondToFriendInvitationDTO {
  FriendUsername: string;
  InvitationResponse: ResponseType;
}

export enum ResponseType {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT'
}
