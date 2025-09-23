import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, CheckCircle2, Clock, Euro, AlertCircle } from "lucide-react";
import type { TabbedLegalReport } from "@/types/case";

interface ReportTabsProps {
  report: TabbedLegalReport;
}

export function ReportTabs({ report }: ReportTabsProps) {
  // Handle both camelCase and snake_case formats for backward compatibility
  const normalizedReport = report ? {
    ...report,
    executive_summary: report.executive_summary || (report as any).executiveSummary,
    qualificazione_giuridica: report.qualificazione_giuridica || (report as any).qualificazioneGiuridica,
    passi_operativi: report.passi_operativi || (report as any).passiOperativi,
  } : null;
  
  if (!normalizedReport) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nessun report disponibile per questo caso.
        </AlertDescription>
      </Alert>
    );
  }
  
  const reportData = normalizedReport;

  return (
    <div className="space-y-6">
      {reportData.disclaimer && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {reportData.disclaimer}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="executive" className="w-full">
        <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
          <TabsTrigger value="executive">Sommario</TabsTrigger>
          <TabsTrigger value="qualificazione">Qualificazione</TabsTrigger>
          <TabsTrigger value="fonti">Fonti</TabsTrigger>
          <TabsTrigger value="opzioni">Opzioni</TabsTrigger>
          <TabsTrigger value="passi">Passi</TabsTrigger>
          <TabsTrigger value="termini">Termini</TabsTrigger>
          <TabsTrigger value="allegati">Allegati</TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.executive_summary ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {reportData.executive_summary.summary || (reportData.executive_summary as any).content}
                  </p>
                  {reportData.executive_summary.key_points && (
                    <ul className="list-disc pl-5 space-y-2">
                      {reportData.executive_summary.key_points.map((point, idx) => (
                        <li key={idx} className="text-muted-foreground">
                          {point}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Nessun sommario disponibile.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qualificazione" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Qualificazione Giuridica</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.qualificazione_giuridica ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {reportData.qualificazione_giuridica.description || (reportData.qualificazione_giuridica as any).content}
                  </p>
                  {reportData.qualificazione_giuridica.articles && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Articoli di riferimento:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {reportData.qualificazione_giuridica.articles.map((article, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            {article}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Nessuna qualificazione disponibile.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fonti" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Fonti Normative</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.fonti?.items?.length ? (
                <div className="space-y-3">
                  {reportData.fonti.items.map((fonte, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{fonte.title}</h4>
                          {fonte.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {fonte.description}
                            </p>
                          )}
                        </div>
                        <a
                          href={fonte.official_url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-4 text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nessuna fonte disponibile.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opzioni" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Opzioni Disponibili</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.opzioni?.rows?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Opzione</th>
                        <th className="text-left p-3">Pro</th>
                        <th className="text-left p-3">Contro</th>
                        <th className="text-left p-3">Tempi</th>
                        <th className="text-left p-3">Costi</th>
                        <th className="text-left p-3">Esito</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.opzioni.rows.map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{row.name || (row as any).option}</td>
                          <td className="p-3 text-sm text-green-600">{row.pro || (row as any).pros}</td>
                          <td className="p-3 text-sm text-red-600">{row.contro || (row as any).cons}</td>
                          <td className="p-3 text-sm">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {row.tempi || '-'}
                          </td>
                          <td className="p-3 text-sm">
                            <Euro className="inline h-3 w-3 mr-1" />
                            {row.costi || '-'}
                          </td>
                          <td className="p-3 text-sm">{row.esito || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">Nessuna opzione disponibile.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="passi" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Passi Operativi</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.passi_operativi?.checklist?.length ? (
                <div className="space-y-3">
                  {reportData.passi_operativi.checklist.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <p className="text-muted-foreground flex-1">{item.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nessun passo operativo disponibile.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="termini" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Termini e Scadenze</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.termini?.deadlines?.length ? (
                  <div className="space-y-3">
                    {report.termini.deadlines.map((deadline, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{deadline.description}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Scadenza: {new Date(deadline.date).toLocaleDateString('it-IT')}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            deadline.type === 'prescription' 
                              ? 'bg-red-100 text-red-700'
                              : deadline.type === 'decadenza'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {deadline.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nessuna scadenza da segnalare.</p>
                )}
                
                {(report.termini?.prescription || report.termini?.decadenza) && (
                  <div className="mt-4 space-y-2">
                    {report.termini.prescription && (
                      <Alert>
                        <AlertDescription>
                          <strong>Prescrizione:</strong> {report.termini.prescription}
                        </AlertDescription>
                      </Alert>
                    )}
                    {report.termini.decadenza && (
                      <Alert>
                        <AlertDescription>
                          <strong>Decadenza:</strong> {report.termini.decadenza}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allegati" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documenti e Allegati</CardTitle>
            </CardHeader>
            <CardContent>
              {report.allegati ? (
                <div className="space-y-4">
                  {report.allegati.present?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">✓ Documenti Presenti</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {report.allegati.present.map((doc, idx) => (
                          <li key={idx} className="text-muted-foreground">{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {report.allegati.missing?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">✗ Documenti Mancanti</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {report.allegati.missing.map((doc, idx) => (
                          <li key={idx} className="text-muted-foreground">{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {report.allegati.nice_to_have?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-600 mb-2">○ Documenti Opzionali</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {report.allegati.nice_to_have.map((doc, idx) => (
                          <li key={idx} className="text-muted-foreground">{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Nessuna informazione sugli allegati.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}