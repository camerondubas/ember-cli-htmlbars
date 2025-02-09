// For ease of debuggin / tweaking:
// https://astexplorer.net/#/gist/bcca584efdab6c981a75618642c76a22/1e1d262eaeb47b7da66150e0781a02b96e597b25
module.exports = function(babel) {
  let t = babel.types;

  return {
    name: 'ember-cli-htmlbars-colocation-template',

    visitor: {
      VariableDeclarator(path, state) {
        if (path.node.id.name === '__COLOCATED_TEMPLATE__') {
          state.colocatedTemplateFound = true;
        }
      },

      ExportDefaultDeclaration(path, state) {
        if (!state.colocatedTemplateFound) {
          return;
        }

        let defaultExportDeclaration = path.node.declaration;
        let setComponentTemplateMemberExpression = t.memberExpression(
          t.identifier('Ember'),
          t.identifier('_setComponentTemplate')
        );
        let colocatedTemplateIdentifier = t.identifier('__COLOCATED_TEMPLATE__');

        if (defaultExportDeclaration.type === 'ClassDeclaration') {
          // when the default export is a ClassDeclaration with an `id`,
          // wrapping it in a CallExpression would remove that class from the
          // local scope which would cause issues for folks using the declared
          // name _after_ the export
          if (defaultExportDeclaration.id !== null) {
            path.parent.body.push(
              t.expressionStatement(
                t.callExpression(setComponentTemplateMemberExpression, [
                  colocatedTemplateIdentifier,
                  defaultExportDeclaration.id,
                ])
              )
            );
          } else {
            path.node.declaration = t.callExpression(setComponentTemplateMemberExpression, [
              colocatedTemplateIdentifier,
              t.classExpression(
                null,
                defaultExportDeclaration.superClass,
                defaultExportDeclaration.body
              ),
            ]);
          }
        } else {
          path.node.declaration = t.callExpression(setComponentTemplateMemberExpression, [
            colocatedTemplateIdentifier,
            defaultExportDeclaration,
          ]);
        }
      },
    },
  };
};
