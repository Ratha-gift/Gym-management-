import type { Membership, Member } from '@/types/member'
import type { MembershipPackage } from '@/types/package'

export interface MembershipRecord extends Membership {
  member?: Member
  package?: MembershipPackage
}
