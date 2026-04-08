import type {
  ActualMilestoneProgress,
  DealSnapshot,
  MilestoneId,
  MilestoneStatus,
} from "./types";

function milestone(
  id: MilestoneId,
  status: MilestoneStatus,
  actualDate?: string,
): ActualMilestoneProgress {
  return { milestoneId: id, status, actualDate };
}

export function deriveMilestoneProgress(snapshot: DealSnapshot): ActualMilestoneProgress[] {
  const info = snapshot.dealInfo;
  const status = String(info.status ?? info.deal_status ?? "").toLowerCase();

  const openedAt = info.opened_at ? String(info.opened_at) : undefined;
  const isOpened = status !== "new" && status !== "";

  const docs = snapshot.documents;
  const docList: Array<Record<string, unknown>> = Array.isArray(docs)
    ? docs
    : Array.isArray(docs.documents)
      ? (docs.documents as Array<Record<string, unknown>>)
      : [];
  const titleDoc = docList.find((doc) => {
    const type = String(doc.document_type ?? doc.type ?? "").toLowerCase();
    return type.includes("title_commitment") || type.includes("commitment") || type.includes("title_search");
  });
  const hasTitleReturned = !!titleDoc;

  const ctc = snapshot.ctcPlan;
  const ctcStatus = ctc ? String(ctc.status ?? ctc.plan_status ?? "").toLowerCase() : "";
  const isCTC = ctcStatus === "approved" || ctcStatus === "complete" || ctcStatus === "completed";
  const ctcDate = ctc ? String(ctc.completed_at ?? ctc.approved_at ?? "") : undefined;

  const signing = snapshot.signing;
  const signingStatus = signing ? String(signing.status ?? "").toLowerCase() : "";
  const signingComplete = signingStatus === "complete" || signingStatus === "completed";
  const signingDate = signing ? String(signing.completed_at ?? signing.signing_date ?? "") : undefined;

  const funding = snapshot.fundingStatus;
  const isFunded =
    status === "funded" ||
    status === "recorded" ||
    (funding ? Boolean(funding.all_funded ?? funding.is_funded) : false);
  const fundedDate = funding ? String(funding.funded_at ?? "") : undefined;

  return [
    milestone("opening", isOpened ? "completed" : "not_started", isOpened ? openedAt : undefined),
    milestone(
      "title_returned",
      hasTitleReturned ? "completed" : isOpened ? "in_progress" : "not_started",
      hasTitleReturned && titleDoc?.uploaded_at ? String(titleDoc.uploaded_at) : undefined,
    ),
    milestone(
      "clear_to_close",
      isCTC ? "completed" : hasTitleReturned ? "in_progress" : "not_started",
      isCTC && ctcDate ? ctcDate : undefined,
    ),
    milestone(
      "signing_complete",
      signingComplete ? "completed" : isCTC ? "in_progress" : "not_started",
      signingComplete && signingDate ? signingDate : undefined,
    ),
    milestone(
      "funded",
      isFunded ? "completed" : signingComplete ? "in_progress" : "not_started",
      isFunded && fundedDate ? fundedDate : undefined,
    ),
  ];
}
