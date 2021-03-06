/**
 * @fileoverview Disallow inherently interactive elements to be assigned
 * non-interactive roles.
 * @author Jesse Beach
 * @flow
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import {
  dom,
} from 'aria-query';
import {
  elementType,
  getProp,
  getLiteralPropValue,
  propName,
} from 'jsx-ast-utils';
import type { JSXIdentifier } from 'ast-types-flow';
import includes from 'array-includes';
import type { ESLintContext } from '../../flow/eslint';
import type { ESLintJSXAttribute } from '../../flow/eslint-jsx';
import isInteractiveElement from '../util/isInteractiveElement';
import isNonInteractiveRole from '../util/isNonInteractiveRole';
import isPresentationRole from '../util/isPresentationRole';

const errorMessage =
  'Interactive elements should not be assigned non-interactive roles.';

const domElements = [...dom.keys()];

module.exports = {
  meta: {
    docs: {},
    schema: [{
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'string',
        },
        uniqueItems: true,
      },
    }],
  },

  create: (context: ESLintContext) => {
    const options = context.options;
    return {
      JSXAttribute: (
        attribute: ESLintJSXAttribute,
      ) => {
        const attributeName: JSXIdentifier = propName(attribute);
        if (attributeName !== 'role') {
          return;
        }
        const node = attribute.parent;
        const attributes = node.attributes;
        const type = elementType(node);
        const role = getLiteralPropValue(getProp(node.attributes, 'role'));

        if (!includes(domElements, type)) {
          // Do not test higher level JSX components, as we do not know what
          // low-level DOM element this maps to.
          return;
        }
        // Allow overrides from rule configuration for specific elements and
        // roles.
        const allowedRoles = (options[0] || {});
        if (
          Object.prototype.hasOwnProperty.call(allowedRoles, type)
          && includes(allowedRoles[type], role)
        ) {
          return;
        }
        if (
          isInteractiveElement(type, attributes)
          && (
            isNonInteractiveRole(type, attributes)
            || isPresentationRole(type, attributes)
          )
        ) {
          // Visible, non-interactive elements should not have an interactive handler.
          context.report({
            node: attribute,
            message: errorMessage,
          });
        }
      },
    };
  },
};
