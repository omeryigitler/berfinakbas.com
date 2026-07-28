import { patchFile, replaceRequired, replaceRegexRequired } from "./dashboard-patch-utils.mjs";

await patchFile("components/ClientDetailsHub.tsx", (initialSource) => {
  let source = initialSource;
  source = source
    .replaceAll("client.parentPrimaryName || 'Ahmet Demir'", "client.parentPrimaryName || 'Girilmedi'")
    .replaceAll("client.parentPrimaryRelation || 'Baba'", "client.parentPrimaryRelation || 'Girilmedi'")
    .replaceAll("client.parentPrimaryEmail || 'veli.demir@e-posta.com'", "client.parentPrimaryEmail || 'Girilmedi'")
    .replaceAll("client.parentSecondaryName || 'Ayşe Demir'", "client.parentSecondaryName || 'Girilmedi'")
    .replaceAll("client.parentSecondaryRelation || 'Anne'", "client.parentSecondaryRelation || 'Girilmedi'")
    .replaceAll("client.parentSecondaryPhone || '0532-555-0220'", "client.parentSecondaryPhone || 'Girilmedi'")
    .replaceAll("client.emergencyContact || 'Ahmet Demir (0532-555-0219)'", "client.emergencyContact || 'Girilmedi'");

  source = replaceRequired(
    source,
    `                    <CustomSelect
                      label="Belge Kategorisi"
                      options={docCategoryOptions}
                      value={docForm.type}
                      onChange={val => setDocForm({...docForm, type: val as any})}
                    />
                  </div>
                </div>`,
    `                    <CustomSelect
                      label="Belge Kategorisi"
                      options={docCategoryOptions}
                      value={docForm.type}
                      onChange={val => setDocForm({...docForm, type: val as any})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-500 font-bold mb-1">Dosya</label>
                    <input
                      type="file"
                      required
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                      onChange={event => {
                        const file = event.target.files?.[0] ?? null;
                        setDocForm({ ...docForm, file, name: file?.name ?? docForm.name });
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-900 focus:outline-none focus:border-black"
                    />
                    <span className="block text-[10px] text-gray-400 font-bold mt-1">En fazla 4 MB</span>
                  </div>
                </div>`,
    "Document file input",
  );

  source = replaceRequired(
    source,
    `                          onClick={() => triggerToast(\`${'${doc.name}'} başarıyla görüntülendi.\`)}`,
    `                          onClick={() => {
                            const url = (doc as any).url;
                            if (!url) return triggerToast('Belge bağlantısı bulunamadı.', 'error');
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}`,
    "Real document view action",
  );
  source = replaceRequired(
    source,
    `                          onClick={() => triggerToast(\`${'${doc.name}'} indirme işlemi tamamlandı.\`)}`,
    `                          onClick={() => {
                            const url = (doc as any).url;
                            if (!url) return triggerToast('Belge bağlantısı bulunamadı.', 'error');
                            window.open(\`${'${url}${url.includes(\'?\') ? \'&\' : \'?\'}download=1'}\`, '_blank', 'noopener,noreferrer');
                          }}`,
    "Real document download action",
  );
  source = replaceRequired(
    source,
    `                          onClick={() => triggerToast(\`${'${doc.name}'} arşive taşındı.\`)}`,
    `                          onClick={() => void handleArchiveDocument(doc)}`,
    "Real document archive action",
  );

  return source;
});
