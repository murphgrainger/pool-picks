# Pool Picks
An application that allows users to create pools, add members, pick atheletes, and win the pool.

## Tech
TypeScript
Next.js
GraphQL
Prisma
Postgresql


## Migrations Flow
This app has two database environments: local and production. Each environment has it's own database but specific scripts are yet setup to manage each separately without swapping out your `DATABASE_URL`.

To work in development mode:
1. Make sure you `DATABASE_URL` is your local database.
2. Update schema.prisma file with your changes.
3. Run `npx prisma db push` to send the changes to the local database
4. Run `npx prisma generate` for the client to see the changes.

To match your dev work in production:
1. Update the `DATABASE_URL` in your .env file to the production database.
2. Run `npx prisma migrate dev` and name the migration for your work. This will push your changes to the production databse.
3. Switch the `DATABASE_URL` in your .env back to the local database! 

## Deployment
Deploy directly through the CLI to Vercel
