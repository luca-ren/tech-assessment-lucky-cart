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

  checkInCriteria(cart, criteriaName, criteriaValue) {
    const [criteriaKey, subCriteriaKey] = criteriaName.split(".");
    if (subCriteriaKey) {
      return cart[criteriaKey].some((cartElement) => {
        return criteriaValue.includes(cartElement[subCriteriaKey]);
      });
    }

    return criteriaValue.includes(cart[criteriaKey]);
  }

  isCriteriaWithPotentialOperatorEligible(cart, criteriaName, criteriaValue) {
    const subCriteriaKey = Object.keys(criteriaValue)[0];
    const subCriteriaValue = Object.values(criteriaValue)[0];

    if (subCriteriaKey === "in") {
      return this.checkInCriteria(cart, criteriaName, subCriteriaValue);
    } else if (typeof subCriteriaValue === "object") {
      const operator = subCriteriaKey;
      return this.checkAndOrCriteria(
        cart[criteriaName],
        subCriteriaValue,
        operator
      );
    }
    return this.checkIsCriteria(cart[criteriaName], criteriaValue);
  }

  checkAndOrCriteria(value, criteria, operator) {
    const method = conditionOperatorToMethod[operator];
    if (!method) {
      throw new Error(`Operator inconnu : ${operator}`);
    }

    return Object.entries(criteria)[method](([curCondName, curCondVal]) => {
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

  isCriteriaEligible(cart, criteriaName, criteriaValue) {
    const [criteriaKey, subCriteriaKey] = criteriaName.split(".");
    if (!cart[criteriaKey]) return false;

    if (subCriteriaKey) {
      if (Array.isArray(cart[criteriaKey])) {
        return cart[criteriaKey]
          .map((subObj) => subObj[subCriteriaKey])
          .includes(criteriaValue);
      }

      return cart[criteriaKey][subCriteriaKey] == criteriaValue;
    }

    return cart[criteriaKey] == criteriaValue;
  }

  isEligible(cart, criteria) {
    const criteriaArray = Object.entries(criteria);
    return criteriaArray.every(([criteriaName, criteriaValue]) => {
      if (typeof criteriaValue === "object") {
        return this.isCriteriaWithPotentialOperatorEligible(
          cart,
          criteriaName,
          criteriaValue
        );
      } else {
        return this.isCriteriaEligible(cart, criteriaName, criteriaValue);
      }
    });
  }
}

module.exports = {
  EligibilityService,
};
