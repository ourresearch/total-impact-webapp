import jinja2

class MarkupFactory(object):
    def __init__(self, user_id, embed=False):
        self.context = {
            "embed": embed,
            "user_id": user_id
        }

    def make_markup(self):
        return Markup(self.context["user_id"], self.context["embed"])


class Markup():
    def __init__(self, user_id, embed=False):
        self.user_id = user_id

        self.template = self._create_template("product.html")

        self.context = {
            "embed": embed,
            "user_id": user_id
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





