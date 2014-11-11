import jinja2


class Markup():
    def __init__(self, url_slug, embed=False):
        self.url_slug = url_slug

        self.template = self._create_template("product.html")

        self.context = {
            "embed": embed,
            "url_slug": url_slug
        }


    def _create_template(self, template_name):
        template_loader = jinja2.FileSystemLoader(searchpath="totalimpactwebapp/templates")
        template_env = jinja2.Environment(loader=template_loader)
        return template_env.get_template(template_name)

    def set_template(self, template_name):
        self.template = self._create_template(template_name)

    def make(self, local_context):
        # the local context overwrites the Self on if there are conflicts.
        full_context = dict(self.context, **local_context)

        return self.template.render(full_context)





