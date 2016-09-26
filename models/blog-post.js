var blogPosts = [{
    "id": 1,
    "title": "Extending ember-resolver to customize codebase structure the way you want.",
    "createdOn": "2016-09-20T04:03:56.571Z",
    "categoryId": 1,
    "abstract": `
Ever since ember introduced POD structure people have been debating about its advantages and disadvantages.
I guess it boils down to the matter of taste and the size of the project itself. I definitely feel like  most of us would 
favor the older approach of having all controllers, routes etc in their respective "controllers", "routes" folder etc if the project size
 is small to medium. For very large projects, the POD structure definitely makes things bit more "well organized" but still 
 as the project size grows even POD structure might feel difficult to maintain. So I am writing this post to break the chain of
   POD vs no POD and have freedom to have folder structure that makes most sense to individual developer. 
 `,
    "content": `
    
<p>I have been developing ember app for quite some time now and as we have progressed towards newer version of ember, it was 
also natural for us to move on from custom build scripts to ember-cli. Before cli, our code base was very module centric 
and that made it easier to isolate resources used in one module from another by placing them in module specific folder. After
ember-cli, we lost the module structure since we had to put all the controllers, models, routes etc in their specific folder.
Since we had big codebase with about 30+ resources/routes and even more components/views to support them, things got bit
rough because we couldn't easily tell which model/component was used in which module. </p>

<p>Few months later as we discovered <a href="http://cball.me/organize-your-ember-app-with-pods/" target="_blank">POD structure</a>, I was super
excited about it because now we could move away from using "resource" and use nested "route" instead, and the nested folder
structure to follow just made sense. It also partially solved for our module structure that we were accustomed to before
because we could use the parent route as module itself. Things were looking good, but POD didn't solve for our 
burning wish to move all other resources(specially components) associated with the route/module within it.
And now all thanks to our <a href="https://twitter.com/@rwjblue" target="_blank">Robert Jackson</a> and his <a href="https://github.com/ember-cli/ember-resolver" target="_blank">ember resolver</a>
 addon we are so much more close to how we wanted to structure our code base. I must say Robert has been an invaluable gift to the
  ember community, I have lost count of the times I have stumbled upon his posts that saved me from all the frustration.</p>  

<p>Ember resolver is as name suggests, responsible for resolving a resource, so simply put, if you ask the resolver to give us a "blog" model, 
it figures out possible locations where the source file could be and returns it if found in one of those locations or will tell
you sorry m8 I couldn't find it. So this is skeleton of the structure that I want my codebase to look like :

   
<pre>

    app
     |-modules//pod prefix
         |-MODULE-NAME-1
             |-models
                  |-model-1
                      |-model.js
                      |-adapter.js
                      |-serializer.js
             |-components
                  |-component-1
                      |-component.js
                      |-template.js
             |-routes
                 |-route-1
                     |-route.js
                     |-template.hbs
                 |-route.js
                 |-template.hbs
         |-MODULE-NAME-2(so on and so forth)
                                  
</pre>

Remember you don't have to follow the same folder pattern that I have here, you can make your own convention and if you follow the example
you should be able to code for it.</p> 
  
<p>Upon close look into resolvers' source code you will notice this particular function: </p>
  
<pre>
  //resolver.js file
  moduleNameLookupPatterns: Ember.computed(function(){
    return [
      this.podBasedModuleName,
      this.podBasedComponentsInSubdir,
      this.mainModuleName,
      this.defaultModuleName
    ];
  })
  
</pre>

Each of these functions in the array returns a path based on "parsedName", which is simply an object that contains details of a 
 resource being requested such as the type of the resource, the name etc. You can easily override this function
  and have it return an array that has your own custom function that will return the right path based on your convention. To do so
  open up resolver.js file which should be located under your /app folder. It should look like:
  
  <pre>
  
    import Resolver from 'ember-resolver';

    export default Resolver;

  </pre>
  
Now we are going to override "moduleNameLookupPatterns" method.
    
    <pre>
    
    import Ember from 'ember';
    import Resolver from 'ember/resolver';
    
    const moduleRoutes = ['route-a', 'route-b'];
    
    var resolver = Resolver.extend({

       /**
       * Custom resolver for hybrid approach of organizing(resolving) resources/files.
       * The method allows for placing resources such as components/routes within your
       * parent route folder. It supports following folder structure
       *
       * app
       *  |-modules
       *      |-parent-route
       *           |-models
       *               |-model-a
       *                  |-model.js
       *                  |-adapter.js
       *                  |-serializer.js
       *           |-components
       *                |-some-component
       *                      |-component.js
       *                      |-template.hbs
       *           |-routes
       *                |-index
       *                    |-route.js
       *                    |-template.hbs
       *                |-route.js
       *                |-template.hbs
       *
       * @method 'myCustomResolver'
       * @param {String} route name
       * @param {Object} parsed resource name
       * @return {String} path to resource
       * */
        myCustomResolver: function (module, parsedName) {
            let podPrefix = this.namespace.podModulePrefix || this.namespace.modulePrefix;
            let path = null;
            let re = new RegExp('^' + module + '(/)?');
            let fullNameWithoutType = parsedName.fullNameWithoutType;
            let moduleNameMatch = fullNameWithoutType.match(re);
            let lookInSubFolder = null;
            
            switch (parsedName.type) {
              case "controller":
              case "route":
                lookInSubFolder = moduleNameMatch ? "routes" : null;
                break;
              case "component":
                lookInSubFolder = "components";
                break;
              case "template":
                //templates can be for components as well as for routes so use different paths based on what context the template is being used.
                let isComponentTemplate = fullNameWithoutType.match(/^components\//);
                fullNameWithoutType = isComponentTemplate ? fullNameWithoutType.replace(/^components\//, '') : fullNameWithoutType;
                lookInSubFolder = isComponentTemplate ? "components" : "routes";
                break;
              case "adapter":
              case "model":
              case "serializer":
                lookInSubFolder = "models";
                break;
            }
            
            if (lookInSubFolder) {
              path = (podPrefix + '/' + module + '/' + lookInSubFolder + '/' + fullNameWithoutType.replace(re, '') + '/' + parsedName.type).replace(/\/{2,}/g, '/');
            }
            return path;
        },
  
        moduleNameLookupPatterns: Ember.computed(function () {
            let defaults = this._super();
            
            modules.forEach((module)=> {
                let methodName = module + 'BasedModuleName';
            
                if (this[methodName]) {
                    defaults.pushObject(this[methodName]);
                }
            });
            
            return defaults;
        })
    
    });   
     
     /**
     * Dynamically injects methods based on modules which calls our custom resolver method
     * */
    moduleRoutes.forEach(function (module) {
        let obj = {};
        let methodName = module + 'BasedModuleName';
        
        obj[methodName] = function (parsedName) {
            return this.myCustomResolver(module, parsedName);
        };
        resolver.reopen(obj);
    });

    export default resolver;
    
    </pre>
</p>

<p>On the ending note, I must say I have not tested the performance impact of this resolver because we will be adding more lookups
per module added to the project. Also as an alternative approach, you might be interested in looking up <a href="https://github.com/dgeb/ember-engines" target="_blank">ember engines</a>,
which also solves for building modular ember applications.
</p>
`
}];

exports.find = function (closure) {
    return blogPosts.filter(closure);
}

exports.normalize = function (post) {
    return {
        "type": "blog-post",
        "id": post.id,
        "attributes": {
            "title": post.title,
            "createdOn": post.createdOn,
            "abstract": post.abstract
        }, "relationships": {
            "category": {
                "data": {"type": "blog-category", "id": post.categoryId}
            },
            "content": {
                "links": {
                    "related": "/api/blog/posts/" + post.id + "/content"
                }
            }
        }
    }
}