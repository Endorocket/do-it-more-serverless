export class RespondToFriendInvitationDTO {
  friendName: string;
  invitationResponse: ResponseType;
}

export enum ResponseType {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT'
}
