import React from 'react';
import {arrive, clamp} from '../motion';
import type {VisualProps} from '../types';
import {IdeaLens} from './IdeaLens';
import {GrowthCycle} from './GrowthCycle';
import {MiroSwarm, MiroForecast} from './mirofish/SwarmScenes';
import {MiroRepository, MiroComment} from './mirofish/IdentityScenes';
import {MiroInputs, MiroPersonas, MiroFeedback} from './mirofish/WorkflowScenes';
import {MiroOfferWorldV3, MiroReactionWorldV3} from './mirofish/WorldScenesV3';
import {MiroRepoStudioV3, MiroInputCollageV3} from './mirofish/AssetScenesV3';
import {MiroAudienceAtlasV3, MiroReactionChatsV3, MiroFeedbackDeskV3, MiroCommentPosterV3} from './mirofish/InteractionScenesV3';
import {ResetLoop, StartingOver, BudgetGauge, ProgressPath, CampaignCheckup, QuestionAgency, KeepProgress, NotTheGoal, TwoQuestions} from './agency/AgencyScenes';
import {SearchNeed, MissingFromResults, ProfileChecklist, WebsiteAreas, ExistsVsHiring} from './findable/FindableScenes';
import {FearDiscount, LessRoom, NervousVsConfident, ExplainPrice, LoseVsUnderpaid, KitchenQuotes, HookScale, SetStandExplain} from './pricing/PricingScenes';
import {M9Long, M9Bill, M9Paying, M9Ceiling, M9Quotes, M9Risk, M9Promises, M9Wins} from './modern/MaxPriceModern';
import {M10Need, M10Missing, M10Profile, M10Website, M10Hire} from './modern/FindableModern';
import {M12Spiral, M12Diagnose, M12FixList, M12Family, M12Seasons} from './modern/SlowMonthModern';
import {M13Week, M13Level, M13Next, M13Streak} from './modern/KeepGoingModern';
import {M14Pretty, M14Bounce, M14Needs, M14Build, M14Mobile, M14Working} from './modern/WebsiteModern';
import {F15Hook, F15Readers, F15Reactions, F15Step1, F15Step2, F15Step3, F15Step4} from './modern/BadReviewModern';
import {M16Roll, M16Post, M16Story, M16Ideas, M16Phone} from './modern/CameraRollModern';
import {LSample} from './modern/kitLight';
import {S18Waiting, S18Homeowner, L18Estimate, S18FollowUp, S18Decision} from './story/Story18';
import {S19Two, S19Reviews, S19Choice, S19Proof, S19Ask, S19Process, S19Next} from './story/Story19';
import {F20Hook, F20Race, F20Ten, F20System, F20Process, F20Half} from './story/Story20';
import {S21Bills, S21Tap, S21Road, S21Budget, S21Free, S21Plan, S21Produce} from './story/Story21';
import {S22Proud, S22Control, S22Slow, S22Another, S22Channels, S22System} from './story/Story22';
import {Overlay23} from './overlay/Overlay23';
import {Overlay24} from './overlay/Overlay24';
import {Overlay25} from './overlay/Overlay25';
import {Overlay26} from './overlay/Overlay26';
import {Whiteboard26} from './whiteboard/Whiteboard26';
import {Whiteboard27} from './whiteboard/Whiteboard27';
import {Whiteboard28} from './whiteboard/Whiteboard28';
import {WB29Year, WB29Projects, WB29Tower} from './whiteboard/Whiteboard29';
import {WB30Base, WB30Builders} from './whiteboard/Whiteboard30';
import {WB31Restaurant, WB31Hidden, WB31Spotlight} from './whiteboard/Whiteboard31';
import {WB32Ask, WB32Race, WB32Ice} from './whiteboard/Whiteboard32';
import {WB33Website} from './whiteboard/Whiteboard33';
import {WB34Dad} from './whiteboard/Whiteboard34';
import {WB35Bridge} from './whiteboard/Whiteboard35';
import {WB36Fish} from './whiteboard/Whiteboard36';
import {WB37Hand} from './whiteboard/Whiteboard37';
import {WB38Fuel, WB38Leak, WB38Qualified} from './whiteboard/Whiteboard38';
import {WB39Online} from './whiteboard/Whiteboard39';
import {WB40Safer} from './whiteboard/Whiteboard40';
import {WB41Farm} from './whiteboard/Whiteboard41';
import {WB42Joseph} from './whiteboard/Whiteboard42';
import {WB43Blueprint} from './whiteboard/Whiteboard43';
import {S17Sources, S17Blind, S17Google, S17Tracker} from './story/Story17';
import {D17Sources, D17Blind, D17Google, L17Tracker, L17Simple, L17Decide} from './modern/TrackingMixed';
import {L16Roll, L16RollPhone, L16Post, L16Story, L16Ideas, L16Phone} from './modern/CameraRollLight';
import {MHook, MFear, MRoom, MTell, MExplain, MWorse, MSteps, MKitchen} from './modern/ModernPricing';
import {LongProject, SurpriseBill, WhatTheyBuy, MaxPriceCeiling, TwoQuotes, RiskUpfront, MoreThanPromises, ConfidentWins} from './maxprice/MaxPriceScenes';
import {BoostPost, ZeroResults, BoostVsCampaign, StepObjective, StepLeadForm, StepArea, StepTrack, StepFollowUp, SameBudget, SystemBehind} from './boost/BoostScenes';
import {BuriedEmail, FinishedSpace, ExcitementCurve, TenSeconds} from './reviews/ReviewScenes';
import {LeadSetup, ResponseRace, ClosedJobs, OnlySpeed, MoneyTable, PickedUpFirst, SameAds, AfterClick, SourceMinutes} from './speed/SpeedScenes';
import {BidLoss, HomeownerFear, NameInsurance, PerceptionType, PerceptionGap, ReliableRisky, FixList, SecondsSearch} from './trust/TrustScenes';
import {WhenItWorks, JustRunMoreAds, ThreeLeaks, BiggerLeak, LeadStamps, Bucket, OneNumber, YourNumbers, Verdict} from './leak/LeakScenes';
import {PriceQuality, OneOfTen, SeoWord, SearchTop3, ServicePages, CardToCalls, OrganicNumbers, RentVsOwn, CompoundVsReset} from './seo/SeoScenes';

// Add an ORIGINAL, topic-specific React/SVG component here. Never execute code
// from transcript text or JSON. Components are reviewed source code imports.
export const SignalFocus: React.FC<VisualProps> = ({beat, brand, frame, fps}) => {
  const data = beat.visual.type === 'custom' ? beat.visual.props : {};
  const label = typeof data?.label === 'string' ? data.label : 'One clear idea';
  const p = clamp(arrive(frame, fps, 8));
  return <svg viewBox="0 0 900 470" style={{width: '100%', height: '100%'}}>
    {Array.from({length: 5}, (_, i) => {
      const y = 70 + i * 80;
      return <g key={i} opacity={.4 + i * .1}>
        <path d={`M45 ${y} C 260 ${y}, 275 235, 440 235`} pathLength="1" stroke={brand.muted} strokeWidth="3" fill="none" strokeDasharray="1" strokeDashoffset={1 - p} />
        <circle cx="45" cy={y} r={8 + i * 2} fill={brand.muted}/>
      </g>;
    })}
    <path d="M440 235H790" pathLength="1" stroke={brand.accent} strokeWidth="6" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - clamp(arrive(frame, fps, 20))} />
    <circle cx="440" cy="235" r={54 * p} fill={brand.accent}/>
    <path d="M420 235L435 250L462 219" stroke={brand.text} strokeWidth="7" fill="none" opacity={clamp((frame - 20) / 8)}/>
    <circle cx="790" cy="235" r="12" fill={brand.accent} opacity={clamp((frame - 25) / 8)}/>
    <text x="440" y="359" fontSize="38" fontWeight="700" textAnchor="middle" fill={brand.text} opacity={clamp((frame - 12) / 12)}>{label}</text>
    <text x="45" y="448" fontSize="22" fill={brand.text}>INPUT</text><text x="790" y="448" fontSize="22" fill={brand.text} textAnchor="end">MEANING</text>
  </svg>;
};

export const registry: Record<string, React.FC<VisualProps>> = {SignalFocus, IdeaLens, GrowthCycle, MiroSwarm, MiroForecast, MiroRepository, MiroComment, MiroInputs, MiroPersonas, MiroFeedback, MiroOfferWorldV3, MiroReactionWorldV3, MiroRepoStudioV3, MiroInputCollageV3, MiroAudienceAtlasV3, MiroReactionChatsV3, MiroFeedbackDeskV3, MiroCommentPosterV3, ResetLoop, StartingOver, BudgetGauge, ProgressPath, CampaignCheckup, QuestionAgency, KeepProgress, NotTheGoal, TwoQuestions, PriceQuality, OneOfTen, SeoWord, SearchTop3, ServicePages, CardToCalls, OrganicNumbers, RentVsOwn, CompoundVsReset, WhenItWorks, JustRunMoreAds, ThreeLeaks, BiggerLeak, LeadStamps, Bucket, OneNumber, YourNumbers, Verdict, BidLoss, HomeownerFear, NameInsurance, PerceptionType, PerceptionGap, ReliableRisky, FixList, SecondsSearch, LeadSetup, ResponseRace, ClosedJobs, OnlySpeed, MoneyTable, PickedUpFirst, SameAds, AfterClick, SourceMinutes, BuriedEmail, FinishedSpace, ExcitementCurve, TenSeconds, BoostPost, ZeroResults, BoostVsCampaign, StepObjective, StepLeadForm, StepArea, StepTrack, StepFollowUp, SameBudget, SystemBehind, LongProject, SurpriseBill, WhatTheyBuy, MaxPriceCeiling, TwoQuotes, RiskUpfront, MoreThanPromises, ConfidentWins, SearchNeed, MissingFromResults, ProfileChecklist, WebsiteAreas, ExistsVsHiring, FearDiscount, LessRoom, NervousVsConfident, ExplainPrice, LoseVsUnderpaid, KitchenQuotes, HookScale, SetStandExplain, MHook, MFear, MRoom, MTell, MExplain, MWorse, MSteps, MKitchen, M9Long, M9Bill, M9Paying, M9Ceiling, M9Quotes, M9Risk, M9Promises, M9Wins, M10Need, M10Missing, M10Profile, M10Website, M10Hire, M12Spiral, M12Diagnose, M12FixList, M12Family, M12Seasons, M13Week, M13Level, M13Next, M13Streak, M14Pretty, M14Bounce, M14Needs, M14Build, M14Mobile, M14Working, F15Hook, F15Readers, F15Reactions, F15Step1, F15Step2, F15Step3, F15Step4, M16Roll, M16Post, M16Story, M16Ideas, M16Phone, LSample, L16Roll, L16RollPhone, L16Post, L16Story, L16Ideas, L16Phone, D17Sources, D17Blind, D17Google, L17Tracker, L17Simple, L17Decide, S17Sources, S17Blind, S17Google, S17Tracker, S18Waiting, S18Homeowner, L18Estimate, S18FollowUp, S18Decision, S19Two, S19Reviews, S19Choice, S19Proof, S19Ask, S19Process, S19Next, F20Hook, F20Race, F20Ten, F20System, F20Process, F20Half, S21Bills, S21Tap, S21Road, S21Budget, S21Free, S21Plan, S21Produce, S22Proud, S22Control, S22Slow, S22Another, S22Channels, S22System, Overlay23, Overlay24, Overlay25, Overlay26, Whiteboard26, Whiteboard27, Whiteboard28, WB29Year, WB29Projects, WB29Tower, WB30Base, WB30Builders, WB31Restaurant, WB31Hidden, WB31Spotlight, WB32Ask, WB32Race, WB32Ice, WB33Website, WB34Dad, WB35Bridge, WB36Fish, WB37Hand, WB38Fuel, WB38Leak, WB38Qualified, WB39Online, WB40Safer, WB41Farm, WB42Joseph, WB43Blueprint};

export const CustomVisual: React.FC<VisualProps> = (props) => {
  if (props.beat.visual.type !== 'custom') return null;
  const Component = registry[props.beat.visual.component];
  if (!Component) throw new Error(`Unknown custom component: ${props.beat.visual.component}. Register it in src/custom/registry.tsx.`);
  return <Component {...props} />;
};
