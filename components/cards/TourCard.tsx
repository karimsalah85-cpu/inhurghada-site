import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Clock, Heart } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";


type TourCardProps = {
  image: string;
  title: string;
  price: string;
  rating: string;
  link: string;
  location: string;
  duration: string;
  description: string;
};



export default function TourCard({
  image,
  title,
  price,
  rating,
  link,
  location,
  duration,
  description,
}: TourCardProps) {
  const { formatPrice, t } = useSiteSettings();


  return (

    <div
      className="
      overflow-hidden
      rounded-3xl
      bg-white
      shadow-lg
      transition
      duration-300
      md:hover:-translate-y-2
      md:hover:shadow-2xl
      "
    >



      {/* IMAGE */}

      <div
        className="
        relative
        h-60
        sm:h-64
        "
      >


        <Image
          src={image}
          alt={title}
          fill
          sizes="
          (max-width:640px) 100vw,
          (max-width:1024px) 50vw,
          33vw
          "
          className="
          object-cover
          transition
          duration-500
          md:hover:scale-110
          "
        />



        {/* DARK OVERLAY */}

        <div
          className="
          absolute
          inset-0
          bg-gradient-to-t
          from-black/40
          to-transparent
          "
        />



        {/* RATING */}

        <div
          className="
          absolute
          left-4
          top-4
          flex
          items-center
          gap-1
          rounded-full
          bg-white
          px-3
          py-2
          shadow
          "
        >

          <Star
            size={16}
            className="
            fill-yellow-400
            text-yellow-400
            "
          />

          <span className="font-semibold">
            {rating}
          </span>

        </div>




        {/* FAVORITE */}

        <button
          type="button"
          aria-label={`Add ${title} to favorites`}
          className="
          absolute
          right-4
          top-4
          rounded-full
          bg-white
          p-3
          shadow
          transition
          hover:scale-110
          "
        >

          <Heart
            size={20}
            className="text-red-500"
          />

        </button>




        {/* BADGE */}

        <div
          className="
          absolute
          bottom-4
          left-4
          rounded-full
          bg-blue-600
          px-4
          py-2
          text-sm
          font-semibold
          text-white
          "
        >

          {t("bestSeller")}

        </div>


      </div>





      {/* CONTENT */}


      <div
        className="
        p-6
        "
      >



        <h3
          className="
          text-2xl
          font-bold
          text-gray-900
          "
        >

          {title}

        </h3>





        <div
          className="
          mt-3
          flex
          items-center
          gap-2
          text-gray-500
          "
        >

          <MapPin size={18}/>

          <span>{location}</span>

        </div>





        <p
          className="
          mt-4
          text-gray-600
          leading-relaxed
          "
        >

          {description}

        </p>






        <div
          className="
          mt-5
          flex
          items-center
          gap-2
          text-gray-500
          "
        >

          <Clock size={18}/>

          <span>{t("everyDay")} · {duration}</span>

        </div>







        <div
          className="
          mt-6
          flex
          items-center
          justify-between
          "
        >



          <div>

            <p className="text-sm text-gray-500">
              From
            </p>


            <p
              className="
              text-3xl
              font-bold
              text-blue-600
              "
            >

              {formatPrice(price)}

            </p>


          </div>






          <Link
            href={link}
            className="
            rounded-xl
            bg-blue-600
            px-6
            py-3
            font-semibold
            text-white
            transition
            hover:bg-blue-700
            "
          >

            Book Now

          </Link>



        </div>



      </div>



    </div>


  );

}
