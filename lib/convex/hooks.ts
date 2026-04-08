"use client";

import { useState } from "react";
import type { FunctionReference } from "convex/server";
import { useMutation, useQuery } from "convex/react";

type MutationStatus = "idle" | "pending" | "success" | "error";

export function useConvexQueryResult<Query extends FunctionReference<"query">>(
  query: Query,
  args: Query["_args"] | "skip",
) {
  const data = useQuery(query, args as any);
  return {
    data: data as Query["_returnType"] | undefined,
    isLoading: args !== "skip" && data === undefined,
    isError: false,
    error: null,
  };
}

export function useConvexMutationResult<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation,
) {
  const runMutation = useMutation(mutation);
  const [status, setStatus] = useState<MutationStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  async function mutateAsync(args: Mutation["_args"]) {
    setStatus("pending");
    setError(null);
    try {
      const result = await runMutation(args as any);
      setStatus("success");
      return result as Mutation["_returnType"];
    } catch (caught) {
      const nextError = caught instanceof Error ? caught : new Error(String(caught));
      setStatus("error");
      setError(nextError);
      throw nextError;
    }
  }

  function mutate(args: Mutation["_args"]) {
    void mutateAsync(args);
  }

  return {
    mutate,
    mutateAsync,
    error,
    isError: status === "error",
    isPending: status === "pending",
    isSuccess: status === "success",
    reset: () => {
      setStatus("idle");
      setError(null);
    },
    status,
  };
}
