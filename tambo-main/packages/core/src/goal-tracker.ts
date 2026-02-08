export interface GoalStep {
  id: string;
  title: string;
}

export interface GoalPlan {
  goalId: string;
  title: string;
  steps: readonly GoalStep[];
}

export interface GoalStepCompletion {
  stepId: string;
  completedAt: string;
}

export interface GoalProgress {
  goalId: string;
  completed: readonly GoalStepCompletion[];
}

const ensureNonEmpty = (value: string, label: string): void => {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be non-empty.`);
  }
};

const ensureUniqueStepIds = (steps: readonly GoalStep[]): void => {
  const seen = new Set<string>();

  for (const step of steps) {
    ensureNonEmpty(step.id, "Step id");
    ensureNonEmpty(step.title, "Step title");

    if (seen.has(step.id)) {
      throw new Error(`Step id "${step.id}" is duplicated in the plan.`);
    }

    seen.add(step.id);
  }
};

export const validateGoalPlan = (plan: GoalPlan): void => {
  ensureNonEmpty(plan.goalId, "Goal id");
  ensureNonEmpty(plan.title, "Goal title");

  if (plan.steps.length === 0) {
    throw new Error("Goal plan must include at least one step.");
  }

  ensureUniqueStepIds(plan.steps);
};

const ensureProgressMatchesPlan = (
  plan: GoalPlan,
  progress: GoalProgress,
): void => {
  if (plan.goalId !== progress.goalId) {
    throw new Error(
      `Progress goal id "${progress.goalId}" does not match plan "${plan.goalId}".`,
    );
  }

  if (progress.completed.length > plan.steps.length) {
    throw new Error("Progress includes more steps than the plan defines.");
  }

  const completedStepIds = new Set<string>();

  for (const [index, completion] of progress.completed.entries()) {
    const expectedStep = plan.steps[index];

    if (!expectedStep) {
      throw new Error("Progress includes a step beyond the plan scope.");
    }

    if (completion.stepId !== expectedStep.id) {
      throw new Error(
        `Progress step "${completion.stepId}" is out of order. Expected "${expectedStep.id}".`,
      );
    }

    if (completedStepIds.has(completion.stepId)) {
      throw new Error(
        `Progress step "${completion.stepId}" is duplicated in completed steps.`,
      );
    }

    completedStepIds.add(completion.stepId);
    ensureNonEmpty(completion.completedAt, "Completion timestamp");
  }
};

const haveEqualCompletions = (
  left: GoalStepCompletion,
  right: GoalStepCompletion,
): boolean => {
  return left.stepId === right.stepId && left.completedAt === right.completedAt;
};

export const createGoalProgress = (plan: GoalPlan): GoalProgress => {
  validateGoalPlan(plan);

  return {
    goalId: plan.goalId,
    completed: [],
  };
};

export const getNextStep = (
  plan: GoalPlan,
  progress: GoalProgress,
): GoalStep | null => {
  validateGoalPlan(plan);
  ensureProgressMatchesPlan(plan, progress);

  return plan.steps[progress.completed.length] ?? null;
};

export const isGoalComplete = (
  plan: GoalPlan,
  progress: GoalProgress,
): boolean => {
  validateGoalPlan(plan);
  ensureProgressMatchesPlan(plan, progress);

  return progress.completed.length === plan.steps.length;
};

export const getRemainingSteps = (
  plan: GoalPlan,
  progress: GoalProgress,
): readonly GoalStep[] => {
  validateGoalPlan(plan);
  ensureProgressMatchesPlan(plan, progress);

  return plan.steps.slice(progress.completed.length);
};

export const advanceGoalProgress = (
  plan: GoalPlan,
  progress: GoalProgress,
  stepId: string,
  completedAt: string = new Date().toISOString(),
): GoalProgress => {
  validateGoalPlan(plan);
  ensureProgressMatchesPlan(plan, progress);

  const nextStep = plan.steps[progress.completed.length];

  if (!nextStep) {
    throw new Error("Goal is already complete.");
  }

  if (stepId !== nextStep.id) {
    const completedIds = progress.completed.map((completion) => completion.stepId);

    if (completedIds.includes(stepId)) {
      throw new Error(`Step "${stepId}" has already been completed.`);
    }

    throw new Error(
      `Step "${stepId}" is not the next required step. Expected "${nextStep.id}".`,
    );
  }

  ensureNonEmpty(completedAt, "Completion timestamp");

  return {
    goalId: progress.goalId,
    completed: [
      ...progress.completed,
      {
        stepId,
        completedAt,
      },
    ],
  };
};

export const assertForwardOnlyProgression = (
  plan: GoalPlan,
  previous: GoalProgress,
  next: GoalProgress,
): void => {
  validateGoalPlan(plan);
  ensureProgressMatchesPlan(plan, previous);
  ensureProgressMatchesPlan(plan, next);

  if (next.completed.length < previous.completed.length) {
    throw new Error("Progress regressed by removing completed steps.");
  }

  for (let index = 0; index < previous.completed.length; index += 1) {
    const previousCompletion = previous.completed[index];
    const nextCompletion = next.completed[index];

    if (!previousCompletion || !nextCompletion) {
      throw new Error("Progress history does not align with previous steps.");
    }

    if (!haveEqualCompletions(previousCompletion, nextCompletion)) {
      throw new Error(
        `Progress diverged at step "${previousCompletion.stepId}". Expected identical completion history.`,
      );
    }
  }
};

export const isForwardOnlyProgression = (
  plan: GoalPlan,
  previous: GoalProgress,
  next: GoalProgress,
): boolean => {
  try {
    assertForwardOnlyProgression(plan, previous, next);
    return true;
  } catch {
    return false;
  }
};
