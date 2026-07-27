import NextImage, { type ImageProps } from "next/image";
import ImageWatermark from "@/components/media/ImageWatermark";

export default function WatermarkedImage(props: ImageProps) {
  return (
    <>
      <NextImage {...props} />
      <ImageWatermark />
    </>
  );
}
