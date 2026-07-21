import Image from "next/image";
import { Car, Users, Briefcase } from "lucide-react";

type TransferCardProps = {
  image: string;
  title: string;
  price: string;
};

export default function TransferCard({
  image,
  title,
  price,
}: TransferCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

      <div className="relative h-60 overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition duration-500 hover:scale-110"
        />
      </div>

      <div className="p-6">

        <h3 className="text-2xl font-bold">
          {title}
        </h3>

        <div className="mt-5 space-y-3">

          <div className="flex items-center gap-2 text-gray-600">
            <Car className="h-5 w-5 text-blue-600" />
            Private Transfer
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-5 w-5 text-blue-600" />
            Up to 4 Passengers
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Briefcase className="h-5 w-5 text-blue-600" />
            4 Large Bags
          </div>

        </div>

        <div className="mt-6 flex items-center justify-between">

          <div>
            <p className="text-sm text-gray-500">
              From
            </p>

            <span className="text-2xl font-bold text-blue-600">
              ${price}
            </span>
          </div>

          <button className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700">
            Book Now
          </button>

        </div>

      </div>

    </div>
  );
}