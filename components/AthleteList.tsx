import React from 'react';

import { gql, useQuery, useMutation } from "@apollo/client";
import type { Athlete as Node } from "@prisma/client";
import { CardAthlete } from "./CardAthlete";

const AllAthletesQuery = gql`
query allAthletesQuery($first: Int, $after: ID) {
  athletes(first: $first, after: $after) {
    pageInfo {
      endCursor
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        first_name
        last_name
        full_name
        ranking
      }
    }
  }
}
`;

const AthleteList = () => {

  const { data, loading, error, fetchMore } = useQuery(AllAthletesQuery, {
    variables: { first: 3 },
  });

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;

  const { endCursor, hasNextPage } = data?.athletes.pageInfo;

  return (
    <div>
      <h3>Athletes</h3>
      {data?.athletes?.edges.map(({ node }: { node: Node }) => (
        <CardAthlete
        key={node.id}
        id={node.id}
        full_name={node.full_name}
        ranking={node.ranking}    
        />
      ))}
              { hasNextPage && (
              <button
                className="px-4 py-2 bg-black text-white rounded my-10"
                onClick={() => {
                  fetchMore({
                    variables: { after: endCursor },
                    updateQuery: (prevResult, { fetchMoreResult }) => {
                      fetchMoreResult.athletes.edges = [
                        ...prevResult.athletes.edges,
                        ...fetchMoreResult.athletes.edges,
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

export default AthleteList;