const isGtThanCondition = (val, cond) => val > cond;
const isLtThanCondition = (val, cond) => val < cond;
const isGteThanCondition = (val, cond) => val >= cond;
const isLteThanCondition = (val, cond) => val <= cond;
const isEqThanCondition = (val, cond) => val == cond;

const conditionNameToFunc = {
  gt: isGtThanCondition,
  lt: isLtThanCondition,
  gte: isGteThanCondition,
  lte: isLteThanCondition,
  eq: isEqThanCondition,
};

const conditionOperatorToMethod = {
  and: "every",
  or: "some",
};

class EligibilityService {
  /**
   * Compare cart data with criteria to compute eligibility.
   * If all criteria are fulfilled then the cart is eligible (return true).
   *
   * @param cart
   * @param criteria
   * @return {boolean}
   */

  isShopperIdEligible(shopperId, criteria) {
    if (!criteria.shopperId) return true;

    if (shopperId == criteria.shopperId) {
      return true;
    }
    return false;
  }

  isTotalAtiEligible(totalAti, criteria) {
    if (!criteria.totalAti) return true;
    const criteriaTotalAti = criteria.totalAti;

    return this.isCriteriaWithPotentialOperatorEligible(
      totalAti,
      criteriaTotalAti
    );
  }

  isDateEligible(cartDate, criteria) {
    if (!criteria.date) return true;

    const criteriaDate = criteria.date;

    return this.isCriteriaWithPotentialOperatorEligible(cartDate, criteriaDate);
  }

  isProductsEligible(products, criteria) {
    if (!criteria["products.productId"]) return true;

    return products.some((product) => {
      return criteria["products.productId"].in.some(
        (element) => element == product.productId
      );
    });
  }

  isCriteriaWithPotentialOperatorEligible(value, criteria) {
    if (typeof criteria === "object") {
      if (typeof Object.values(criteria)[0] === "object") {
        const operator = Object.keys(criteria)[0];
        return this.checkAndOrCriteria(value, criteria[operator], operator);
      }
      return this.checkIsCriteria(value, criteria);
    } else return criteria == value;
  }

  checkAndOrCriteria(value, criterias, operator) {
    const method = conditionOperatorToMethod[operator];
    if (!method) {
      throw new Error(`Operator inconnu : ${operator}`);
    }

    return Object.entries(criterias)[method](([curCondName, curCondVal]) => {
      const comparator = conditionNameToFunc[curCondName];
      if (!comparator) {
        throw new Error(`Condition inconnue : ${curCondName}`);
      }
      return comparator(value, curCondVal);
    });
  }

  checkIsCriteria(value, criteria) {
    if (criteria.length > 1) {
      throw new Error(`Trop de condition : ${criteria}`);
    }
    const conditionName = Object.keys(criteria)[0];
    const comparator = conditionNameToFunc[conditionName];
    if (!comparator) {
      throw new Error(`Condition inconnue : ${conditionName}`);
    }
    return comparator(value, criteria[conditionName]);
  }

  isEligible(cart, criteria) {
    let cartIsEligible = true;

    cartIsEligible =
      this.isTotalAtiEligible(cart.totalAti, criteria) &&
      this.isShopperIdEligible(cart.shopperId, criteria) &&
      this.isProductsEligible(cart.products, criteria) &&
      this.isDateEligible(cart.date, criteria);

    return cartIsEligible;
  }
}

module.exports = {
  EligibilityService,
};
