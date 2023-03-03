import { builder } from "./builder";
import "./types/Link"
import "./types/User"
import "./types/Tournament"
import "./types/Athlete"
import "./types/Pool"
import "./types/PoolInvite"
import "./types/PoolMember"

export const schema = builder.toSchema()
