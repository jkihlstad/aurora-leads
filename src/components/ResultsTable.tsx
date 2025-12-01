import { FaLinkedin, FaLink } from "react-icons/fa";
import { MdCheckCircle, MdCancel, MdError } from "react-icons/md";
import { LeadData } from "@/context/LeadsContext";

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "success":
      return (
        <div className="bg-green-100 p-1 rounded-full inline-block">
          <MdCheckCircle className="h-4 w-4 text-green-500" />
        </div>
      );
    case "error":
      return (
        <div className="bg-red-100 p-1 rounded-full inline-block">
          <MdCancel className="h-4 w-4 text-red-500" />
        </div>
      );
    case "warning":
      return (
        <div className="bg-yellow-100 p-1 rounded-full inline-block">
          <MdError className="h-4 w-4 text-yellow-500" />
        </div>
      );
    default:
      return null;
  }
};

export const ResultsTable = ({ data }: { data: LeadData[] }) => {
  if (data.length === 0) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-lg border border-gray-200 text-center text-gray-500">
        No results yet. Start a search above.
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((lead) => (
          <div
            key={lead.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {lead.name}
                </h3>
                <p className="text-xs text-gray-500 truncate">{lead.company}</p>
              </div>
              <StatusIcon status={lead.status} />
            </div>

            <div className="space-y-2 mt-3">
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-14 shrink-0">Phone:</span>
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-blue-600 hover:text-blue-800 truncate"
                  >
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-14 shrink-0">Email:</span>
                  <span className="flex items-center gap-1 truncate text-gray-700">
                    <span className="truncate">{lead.email}</span>
                    {lead.verified && (
                      <MdCheckCircle className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </span>
                </div>
              )}
              {lead.linkedin && lead.linkedin !== "#" && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-14 shrink-0">Link:</span>
                  <a
                    href={lead.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {lead.linkedin.includes("linkedin.com") ? (
                      <FaLinkedin className="h-4 w-4" />
                    ) : (
                      <FaLink className="h-4 w-4" />
                    )}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company / Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email (Verified){" "}
                <MdCheckCircle className="inline h-4 w-4 text-primary ml-1" />
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Website / LinkedIn
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {lead.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {lead.company}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    {lead.email}
                    {lead.verified && (
                      <MdCheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600">
                  {lead.linkedin && lead.linkedin !== "#" ? (
                    <a
                      href={lead.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-800 inline-flex justify-center"
                    >
                      {lead.linkedin.includes("linkedin.com") ? (
                        <FaLinkedin className="h-5 w-5" />
                      ) : (
                        <FaLink className="h-4 w-4" />
                      )}
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                  <StatusIcon status={lead.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
