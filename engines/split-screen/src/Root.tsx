import React from 'react';
import {Composition} from 'remotion';
import {SplitScreen} from './SplitScreen';
import {demoPlan} from './demo';
import {SourceFixture} from './SourceFixture';

export const Root: React.FC = () => <><Composition id="SplitScreen" component={SplitScreen} durationInFrames={420} width={1080} height={1920} fps={30} defaultProps={{plan: demoPlan}} calculateMetadata={({props}) => ({durationInFrames: props.plan.edit.cuts.reduce((total, cut) => total + cut.endFrame - cut.startFrame, 0), width: props.plan.width, height: props.plan.height, fps: props.plan.fps})}/><Composition id="SourceFixture" component={SourceFixture} durationInFrames={420} width={1080} height={1080} fps={30}/></>;
