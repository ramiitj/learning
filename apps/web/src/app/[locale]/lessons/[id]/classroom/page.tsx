import { LessonPage, lessonMetadata, lessonStaticParams, type LessonParams } from "../lesson-page";

// Lessons published after a build render on first visit, then stay cached until the next publish.
export const dynamicParams = true;
export const generateStaticParams = lessonStaticParams;
export const generateMetadata = ({ params }: { params: LessonParams }) => lessonMetadata(params);

export default function Page({ params }: { params: LessonParams }) {
  return <LessonPage params={params} mode="classroom" />;
}
