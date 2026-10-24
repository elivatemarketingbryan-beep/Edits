import type React from "react";
import type { FxProps } from "../lib/types";
import CaptionsOnly from "./CaptionsOnly";
import CaptionsOnlyMeta from "../../effects/captions.json";
import Orbit from "./Orbit";
import OrbitMeta from "../../effects/orbit.json";
import CouchWall from "./CouchWall";
import CouchWallMeta from "../../effects/couch-wall.json";
import UiWorld from "./UiWorld";
import UiWorldMeta from "../../effects/ui-world.json";
import FrameBreak from "./FrameBreak";
import FrameBreakMeta from "../../effects/frame-break.json";
import DigitalZoom from "./DigitalZoom";
import DigitalZoomMeta from "../../effects/digital-zoom.json";
import PhoneMockup from "./PhoneMockup";
import PhoneMockupMeta from "../../effects/phone-mockup.json";
import Checklist from "./Checklist";
import ChecklistMeta from "../../effects/checklist.json";
import HeadlineWall from "./HeadlineWall";
import HeadlineWallMeta from "../../effects/headline-wall.json";
import ZoomThroughCut from "./ZoomThroughCut";
import ZoomThroughCutMeta from "../../effects/zoom-through-cut.json";
import ChartGrow from "./ChartGrow";
import ChartGrowMeta from "../../effects/chart-grow.json";
import PullBackReveal from "./PullBackReveal";
import PullBackRevealMeta from "../../effects/pull-back-reveal.json";
import GreenScreen from "./GreenScreen";
import GreenScreenMeta from "../../effects/green-screen.json";
import PaperCut from "./PaperCut";
import PaperCutMeta from "../../effects/paper-cut.json";
import DoodleBoil from "./DoodleBoil";
import DoodleBoilMeta from "../../effects/doodle-boil.json";
import Vertigo from "./Vertigo";
import VertigoMeta from "../../effects/vertigo.json";
import CoverStory from "./CoverStory";
import CoverStoryMeta from "../../effects/cover-story.json";
import GlassType from "./GlassType";
import GlassTypeMeta from "../../effects/glass-type.json";

export type EffectMeta = {
  number: number;
  id: string;
  compositionId: string;
  title: string;
  summary: string;
  needs: { matte?: boolean; contours?: boolean; plate?: boolean; secondClip?: string };
  defaults: Record<string, any>;
  captions: Record<string, any>;
};

export const EFFECTS: { meta: EffectMeta; component: React.FC<FxProps> }[] = [
  { meta: CaptionsOnlyMeta as EffectMeta, component: CaptionsOnly },
  { meta: OrbitMeta as EffectMeta, component: Orbit },
  { meta: CouchWallMeta as EffectMeta, component: CouchWall },
  { meta: UiWorldMeta as EffectMeta, component: UiWorld },
  { meta: FrameBreakMeta as EffectMeta, component: FrameBreak },
  { meta: DigitalZoomMeta as EffectMeta, component: DigitalZoom },
  { meta: PhoneMockupMeta as EffectMeta, component: PhoneMockup },
  { meta: ChecklistMeta as EffectMeta, component: Checklist },
  { meta: HeadlineWallMeta as EffectMeta, component: HeadlineWall },
  { meta: ZoomThroughCutMeta as EffectMeta, component: ZoomThroughCut },
  { meta: ChartGrowMeta as EffectMeta, component: ChartGrow },
  { meta: PullBackRevealMeta as EffectMeta, component: PullBackReveal },
  { meta: GreenScreenMeta as EffectMeta, component: GreenScreen },
  { meta: PaperCutMeta as EffectMeta, component: PaperCut },
  { meta: DoodleBoilMeta as EffectMeta, component: DoodleBoil },
  { meta: VertigoMeta as EffectMeta, component: Vertigo },
  { meta: CoverStoryMeta as EffectMeta, component: CoverStory },
  { meta: GlassTypeMeta as EffectMeta, component: GlassType },
];
