import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-xl flex items-center justify-center py-20 text-white">
      <Spinner className="w-8 h-8" />
    </div>
  );
}
