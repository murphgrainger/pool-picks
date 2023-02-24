// /pages/index.tsx
import Head from "next/head";
import { gql, useQuery, useMutation } from "@apollo/client";
import { Tournament } from "../components/Tournament";
import type { Tournament as Node } from "@prisma/client";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";

const AllTournamentsQuery = gql`
  query allTournamentsQuery($first: Int, $after: ID) {
    tournaments(first: $first, after: $after) {
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        cursor
        node {
          name
          sport
          start_date
          par
          cut
          status
        }
      }
    }
  }
`;

function Home() {
  const { user } = useUser()
  const { data, loading, error, fetchMore } = useQuery(AllTournamentsQuery, {
    variables: { first: 3 },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center">
        To view the tournaments you need to{' '}
        <Link href="/api/auth/login" className=" block bg-gray-100 border-0 py-1 px-3 focus:outline-none hover:bg-gray-200 rounded text-base mt-4 md:mt-0">
          Login
        </Link>
      </div>
    );
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;

  const { endCursor, hasNextPage } = data?.tournaments.pageInfo;

  return (
    <div>
      <Head>
        <title>Pool Picks</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container mx-auto max-w-5xl my-20 flex flex-wrap items-center flex-col">
      <h1 className="text-center">Welcome to Pool Picks</h1>
      <div>
      {user && (
        <div className="flex flex-col justify-center items-center flex-wrap">
         <Link href="/admin"><button>Create Tournament</button></Link>
        </div>
          )}
      </div>
        <div className="flex flex-col p-4 w-full">
          <h3>Tournaments</h3>
          {data?.tournaments.edges.map(({ node }: { node: Node }) => (
            <Link href={`/tournament/${node.id}`}>
              <Tournament {...node}              
                />
            </Link>
          ))}
        </div>
        {hasNextPage ? (
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded my-10"
            onClick={() => {
              fetchMore({
                variables: { after: endCursor },
                updateQuery: (prevResult, { fetchMoreResult }) => {
                  fetchMoreResult.tournaments.edges = [
                    ...prevResult.tournaments.edges,
                    ...fetchMoreResult.tournaments.edges,
                  ];
                  return fetchMoreResult;
                },
              });
            }}
          >
            more
          </button>
        ) : (
          <p className="my-10 text-center font-medium">
            You've reached the end!{" "}
          </p>
        )}
      </div>
    </div>
  );
}

export default Home;
