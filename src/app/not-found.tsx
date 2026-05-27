import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex h-[500px] flex-col items-center justify-center text-white">
      <Image
        src="/scorebug-svg.svg"
        alt="404 Not Found"
        width={92}
        height={124}
        className="w-auto h-48 mb-3"
      />
      <h1 className="text-4xl font-bold">Scorebug caught a 404</h1>
    </div>
  );
}
