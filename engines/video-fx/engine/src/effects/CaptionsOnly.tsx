import React from "react";
import { ClipVideo } from "../lib/media";
import { makeFx } from "../lib/shell";

/** No effect: plain footage; the shell adds the shared captions on top. */
const CaptionsOnly: React.FC = () => <ClipVideo />;

export default makeFx(CaptionsOnly);
