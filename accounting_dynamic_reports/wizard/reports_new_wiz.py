# -*- coding: utf-8 -*-
##############################################################################
#
#    Cybrosys Technologies Pvt. Ltd.
#    Copyright (C) 2017-TODAY Cybrosys Technologies(<https://www.cybrosys.com>).
#    Author: LINTO C T(<https://www.cybrosys.com>)
#    you can modify it under the terms of the GNU LESSER
#    GENERAL PUBLIC LICENSE (LGPL v3), Version 3.
#
#    It is forbidden to publish, distribute, sublicense, or sell copies
#    of the Software or modified copies of the Software.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU LESSER GENERAL PUBLIC LICENSE (LGPL v3) for more details.
#
#    You should have received a copy of the GNU LESSER GENERAL PUBLIC LICENSE
#    GENERAL PUBLIC LICENSE (LGPL v3) along with this program.
#    If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################

from odoo import models, fields


class NewReportsWiz(models.TransientModel):
    _name = 'report.extended.wiz'

    name = fields.Many2one('account.financial.report', string="Report", domain=[('parent_id', '=', None)], required=True)
    type = fields.Selection([('all', 'All'), ('posted', 'Posted')], string="Type", default='all')

    def print_report(self):
        if self.name:
            vals = {
                'report_id': self.name.id,
                'report_name': self.name.name,
                'type': self.type,
            }
            return {
                'type': 'ir.actions.client',
                'tag': 'report_bs_view',
                'vals': vals
            }

