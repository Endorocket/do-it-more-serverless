import { ResponseType } from './responseType';

export interface RespondToFriendInvitationDTO {
  FriendUsername: string;
  InvitationResponse: ResponseType;
}
