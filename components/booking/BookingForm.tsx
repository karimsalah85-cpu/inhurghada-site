"use client";

import { type FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";

import {
  CalendarDays,
  Users,
  MessageCircle,
  Phone,
  User,
  Hotel,
} from "lucide-react";


type BookingFormProps = {
  tourName: string;
  price?: string;
  priceUnit?: string;
  duration?: string;
  location?: string;
};



export default function BookingForm({

  tourName,
  price,
  priceUnit,
  duration,
  location,
}: BookingFormProps) {
  const searchParams = useSearchParams();
  const { formatPrice } = useSiteSettings();

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [date, setDate] = useState(
    () => searchParams.get("date") ?? ""
  );

  const [guests, setGuests] = useState(
    () => searchParams.get("guests") ?? "1"
  );

  const [hotel, setHotel] = useState("");

  const [message, setMessage] = useState("");




  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !phone.trim() || !date) {
      alert("Please fill your name, WhatsApp number and date");
      return;
    }

    const cleanPhone = phone.trim();
    const amount = Number(price || 0);

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "tour",
        customerName: name.trim(),
        phone: cleanPhone,
        tourName,
        location: location || "Hurghada",
        duration: duration || "Please confirm",
        price: price ? `${formatPrice(price)} ${priceUnit ?? "per person"}` : "Please confirm",
        date,
        guests,
        hotel,
        message,
        amount,
        currency: "usd",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.error || "Booking submission failed. Please try again.");
      return;
    }

    if (data.paymentUrl) {
      window.location.href = data.paymentUrl;
      return;
    }

    alert(`Booking request received. Your reference is ${data.reference}. We will confirm shortly.`);
  }




  return (

    <div
      className="
      rounded-3xl
      border
      bg-white
      p-8
      shadow-xl
      "
    >


      <h2 className="
        text-3xl
        font-bold
      ">
        Book Your Trip
      </h2>



      <div className="
        mt-5
        rounded-2xl
        border border-cyan-100 bg-cyan-50
        p-5
      ">

        <h3 className="
          font-bold
          text-blue-700
        ">
          {tourName}
        </h3>


        <p className="
          mt-1
          text-gray-600
        ">
          {duration} • {location}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Secure your place with a fast booking request, instant confirmation updates, and optional payment checkout.
        </p>

      </div>





      <form
        onSubmit={submitBooking}
        className="
        mt-8
        space-y-4
      ">



        <div className="relative">

          <User
            className="absolute left-4 top-4 text-gray-400"
            size={20}
          />

          <input
            id="name"
            name="name"
            type="text"
            placeholder="Full Name"
            className="w-full rounded-xl border p-4 pl-12"
            value={name}
            onChange={(e)=>
              setName(e.target.value)
            }
            autoComplete="name"
            required
          />

        </div>





        <div className="relative">

          <Phone
            className="absolute left-4 top-4 text-gray-400"
            size={20}
          />

          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="WhatsApp Number"
            className="w-full rounded-xl border p-4 pl-12"
            value={phone}
            onChange={(e)=>
              setPhone(e.target.value)
            }
            autoComplete="tel"
            required
          />

        </div>





        <div className="relative">

          <Hotel
            className="absolute left-4 top-4 text-gray-400"
            size={20}
          />

          <input
            id="hotel"
            name="hotel"
            type="text"
            placeholder="Hotel Name / Pickup Location"
            className="w-full rounded-xl border p-4 pl-12"
            value={hotel}
            onChange={(e)=>
              setHotel(e.target.value)
            }
            autoComplete="organization"
          />

        </div>





        <div className="relative">

          <CalendarDays
            className="absolute left-4 top-4 text-gray-400"
            size={20}
          />


          <input
            id="date"
            name="date"
            type="date"
            min={new Date().toISOString().split("T")[0]}
            className="w-full rounded-xl border p-4 pl-12"
            value={date}
            onChange={(e)=>
              setDate(e.target.value)
            }
            required
          />

        </div>





        <div className="relative">

          <Users
            className="absolute left-4 top-4 text-gray-400"
            size={20}
          />

          <input
            id="guests"
            name="guests"
            type="number"
            min="1"
            step="1"
            className="w-full rounded-xl border p-4 pl-12"
            value={guests}
            onChange={(e)=>
              setGuests(e.target.value)
            }
          />

        </div>





        <textarea
          id="message"
          name="message"
          placeholder="Special requests"

          className="
          h-28
          w-full
          rounded-xl
          border
          p-4
          "

          value={message}

          onChange={(e)=>
            setMessage(e.target.value)
          }

        />





        <button
          type="submit"

          className="
          flex
          w-full
          items-center
          justify-center
          gap-3
          rounded-xl
          bg-green-600
          py-4
          font-bold
          text-white
          transition
          hover:bg-green-700
          "

        >

          <MessageCircle size={22}/>

          Send booking request


        </button>



      </form>



    </div>

  );

}
