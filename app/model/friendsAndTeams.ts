import { FriendModel } from './user';
import { TeamModel } from './team';

export interface FriendsAndTeamsModel {
  friends: FriendModel[];
  teams: TeamModel[];
}
