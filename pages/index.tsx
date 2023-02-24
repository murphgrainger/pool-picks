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
          id
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
  console.log(data?.tournaments?.edges)

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;

  const { endCursor, hasNextPage } = data?.tournaments.pageInfo;

  return (
    <div>
      <div className="container mx-auto max-w-5xl my-20 flex flex-wrap items-center flex-col">
        <div>
        {user && (
          <div className="flex flex-col justify-center items-center flex-wrap">
          <Link href="/admin"><button>Create Tournament</button></Link>
          </div>
            )}
        </div>
      { data?.tournaments?.edges &&
        (
        <div className="w-full">
          <div className="flex flex-col p-4 w-full">
            <h3>Tournaments</h3>
            {data?.tournaments.edges.map(({ node }: { node: Node }) => (
              <Link href={`/tournament/${node.id}`}>
                <Tournament
                  key={node.id}
                  id={node.id}
                  name={node.name}
                  par={node.par}          
                  />
              </Link>
            ))}
            { hasNextPage && (
              <button
                className="px-4 py-2 bg-black text-white rounded my-10"
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
              </button>) 
            }
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default Home;
