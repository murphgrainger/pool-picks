// graphql/schema.ts

import { builder } from "./builder";
import "./types/Link"
import "./types/User"
import "./types/Tournament"
import "./types/Athlete"


export const schema = builder.toSchema()
