import { LessonPage, lessonMetadata, lessonStaticParams, type LessonParams } from "./lesson-page";

export const dynamicParams = false;
export const generateStaticParams = lessonStaticParams;
export const generateMetadata = ({ params }: { params: LessonParams }) => lessonMetadata(params);

export default function Page({ params }: { params: LessonParams }) {
  return <LessonPage params={params} mode="personal" />;
}
