import {html} from "lit-element";
import {BaseElement} from "../BaseElement";

/**
 * Element that renders an assessment question shell.
 * Needs children that extend BaseResponseElement to work corectly.
 *
 * @extends {BaseElement}
 */
class AssessmentQuestion extends BaseElement {
  static get properties() {
    return {
      state: {type: String, reflect: true},
    };
  }

  constructor() {
    super();
    this.state = "unanswered";
    this.prerenderedChildren = null;
    this.ctaLabel = "Check";

    this.updateResponseComponents = this.updateResponseComponents.bind(this);
    this.checkNextQuestion = this.checkNextQuestion.bind(this);
    this.requestNextQuestionNav = this.requestNextQuestionNav.bind(this);
    this.requestAssessmentReset = this.requestAssessmentReset.bind(this);
    this.responseComponentUpdated = this.responseComponentUpdated.bind(this);
    this.reset = this.reset.bind(this);
  }

  render() {
    if (!this.prerenderedChildren) {
      this.prerenderedChildren = [];

      for (const child of this.children) {
        this.prerenderedChildren.push(child);
      }
    }

    /* eslint-disable indent */
    return html`
      <div class="web-question__content">
        ${this.prerenderedChildren}
      </div>
      <div class="web-question__footer">
        <span></span>
        <button
          @click="${this.onSubmit}"
          class="w-button w-button--primary"
          ?disabled="${this.state !== "unanswered" ? false : true}"
        >
          ${this.ctaLabel}
        </button>
      </div>
    `;
    /* eslint-enable indent */
  }

  firstUpdated() {
    // Listen to state updates from child response components.
    const responseComponents = this.querySelectorAll("[data-role=response]");

    for (const component of responseComponents) {
      component.addEventListener(
        "response-update",
        this.responseComponentUpdated,
      );
    }
  }

  // Update question state based on state of response components.
  // Stop updating question state as soon as any response component reports
  // that it's unanswered or answered incorrectly.
  // (If any part of the question is incomplete or wrong,
  // the whole question is incomplete or wrong, in descending priority.)
  responseComponentUpdated() {
    const responseComponents = this.querySelectorAll("[data-role=response]");

    for (const component of responseComponents) {
      this.state = component.state;
      if (component.state === "unanswered") {
        return;
      }
      if (component.state === "answeredIncorrectly") {
        return;
      }
    }
  }

  onSubmit(e) {
    switch (this.state) {
      case "answeredCorrectly":
        this.updateResponseComponents();
        this.state = "completed";
        this.ctaLabel = this.checkNextQuestion() ? "Next" : "Reset quiz";
        break;
      case "answeredIncorrectly":
        this.updateResponseComponents();
        this.state = "unanswered";
        this.ctaLabel = "Recheck";
        break;
      case "completed":
        const nextQuestion = this.checkNextQuestion();

        if (nextQuestion) {
          this.requestNextQuestionNav();
        } else {
          this.requestAssessmentReset();
        }
    }
  }

  updateResponseComponents() {
    const responseComponents = this.querySelectorAll("[data-role=response]");

    for (const responseComponent of responseComponents) {
      responseComponent.submitResponse();
    }
  }

  // This should probably emit a custom event that the Tabs component responds to.
  checkNextQuestion() {
    const panel = this.closest(".web-tabs__panel");

    if (!panel) return;

    const nextPanel = panel.nextElementSibling;

    return nextPanel;
  }

  requestNextQuestionNav() {
    const event = new Event("request-nav-to-next");

    this.dispatchEvent(event);
  }

  requestAssessmentReset() {
    const event = new Event("request-assessment-reset");

    this.dispatchEvent(event);
  }

  // Helper function to allow other components to reset the question
  // to its unanswered state.
  reset() {
    const responseComponents = this.querySelectorAll("[data-role=response]");
    const questionContent = this.querySelector(".web-question__content");

    for (const responseComponent of responseComponents) {
      responseComponent.reset();
    }
    this.ctaLabel = "Check";
    questionContent.scrollTop = 0;
  }
}

customElements.define("web-question", AssessmentQuestion);
