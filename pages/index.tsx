import Head from "next/head";
import { gql, useQuery, useMutation } from "@apollo/client";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from 'next/router';

function Home() {
  const { user } = useUser();
  const router = useRouter();

      const HomeDataQuery = gql`
        query allDataQuery {
          pendingPoolInvites {
            id
            email
            status
            created_at  
            pool {
              id
              name
            }
          }
          poolMembers {
            id
            pool {
              id
              name
            }
          }
        }`

  const CreatePoolInviteMutation = gql`
    mutation($id: ID!, $status: String!) {
     updatePoolInvite(id: $id, status: $status) { status }
  }`

  const CreatePoolMemberMutation = gql`
    mutation($pool_id: String!) {
      createPoolMember(pool_id: $pool_id) { pool_id }
    }`

  const [updatePoolInviteStatus] = useMutation(CreatePoolInviteMutation)
  const [createPoolMember] = useMutation(CreatePoolMemberMutation)

  const updateInviteStatus = async (id:number, status:string, pool_id:string) => {

    try {
      await updatePoolInviteStatus({ variables: { id, status } });
      if(status === "Accepted") {
      // if accept create new pool member and redirect to pool
      await createPoolMember({ variables: { pool_id } });
        router.push(`/pool/${pool_id}`)
        return;
      }
      // if reject remove invite card from screen
      return;
      
    } catch (error) {
      console.log(error)
    }
  }

  const { data, loading, error } = useQuery(HomeDataQuery)
  console.log(data)

    if (loading) return <p className="text-center">Loading...</p>;
    if (error) return <p>Oh no... {error.message}</p>;

  return (
    <div>
      <Head>        
        <title>Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col p-4">
        <div className="flex flex-col justify-center items-center flex-wrap rounded bg-blue-400 w-full mt-4 py-8 px-6">
          <h3 className="mb-4">Active Pools</h3>
          { data?.pendingPoolInvites?.map((invite:any) => (
        <div className="p-4 bg-yellow-200 w-full rounded" key={invite.id}>
            <div className="text-center">
              <span>You have been invited to:</span>
              <h3 className="mb-4">{invite.pool.name}</h3>
              <div className="flex flex-wrap justify-center">
                <button className="button-tertiary bg-gray-400" onClick={() => {updateInviteStatus(invite.id, "Rejected", invite.pool_id)}}>Reject</button>
                <button className="button-tertiary bg-green-500" onClick={() => {updateInviteStatus(invite.id, "Accepted", invite.pool_id,)}}>Accept</button>
              </div>
            </div>
          </div>
          ))}
          { data?.poolMembers?.map((member:any) => (
        <div className="p-4 bg-blue-200 w-full rounded" key={member.id}>
            <div className="text-center">
              <h3 className="mb-4">{member.pools.name}</h3>
              <div className="flex flex-wrap justify-center">
                <Link href={`/pool/${member.pool_id}`}><button className="rounded">Go to Pool</button></Link>
              </div>
            </div>
          </div>
          ))}
        </div>
        <div className="w-full">
          <div className="flex flex-col p-4 w-full">
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
