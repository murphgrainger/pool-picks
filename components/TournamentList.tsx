import React from 'react';

import { gql, useQuery, useMutation } from "@apollo/client";
import { CardTournament } from "./CardTournament";
import type { Tournament as Node } from "@prisma/client";
import Link from "next/link";


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
        }
      }
    }
  }
`;

const TournamentList = () => {

    const { data, loading, error, fetchMore } = useQuery(AllTournamentsQuery, {
    variables: { first: 3 },
    });
    

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;

  const { endCursor, hasNextPage } = data?.tournaments.pageInfo;

  return (
    <div>
      <h3>Tournaments</h3>
        {data?.tournaments.edges.map(({ node }: { node: Node }) => (
            <Link href={`/tournament/${node.id}`} key={node.id}>
            <CardTournament
                key={node.id}
                id={node.id}
                name={node.name}       
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
  );
};

export default TournamentList;