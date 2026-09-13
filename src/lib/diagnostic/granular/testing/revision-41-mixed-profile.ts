import type {MixedProfileTarget} from "./mixed-profile-trace";

/** Fixed reverse-outcome profile for the revision-41 full-budget replay. */
export const REVISION_41_MIXED_TARGETS:MixedProfileTarget[]=[
 {skillId:"produire_present_indicatif::writing-controlled-production::verb:être",expected:"weak"},
 {skillId:"produire_present_indicatif::writing-controlled-production::verb:avoir",expected:"known"},
 {skillId:"produire_present_indicatif::writing-controlled-production::verb:aller",expected:"weak"},
 {skillId:"produire_imparfait::writing-controlled-production::verb:aller",expected:"known"},
 {skillId:"accorder_participe_etre::writing-controlled-production::construction:feminine",expected:"known"},
 {skillId:"accorder_participe_etre::writing-controlled-production::construction:plural",expected:"weak"},
 {skillId:"construction_subordonnee_relative::writing-controlled-production",expected:"weak"},
 {skillId:"construction_subordonnee_completive::writing-controlled-production",expected:"known"},
 {skillId:"orthographier_nasale_on_om::writing-controlled-production",expected:"weak"},
 {skillId:"appliquer_m_devant_m_b_p::writing-controlled-production",expected:"known"},
 {skillId:"localiser_information_explicite::all-receptive::text_type:narrative",expected:"weak"},
 {skillId:"inferer_cause_locale::all-receptive::text_type:narrative",expected:"known"},
];

/** The same declared contrasts under a broad struggling response pattern. */
export const REVISION_41_BROAD_STRUGGLING_TARGETS:MixedProfileTarget[]=REVISION_41_MIXED_TARGETS.map(target=>({
 skillId:target.skillId,expected:"weak",
}));
